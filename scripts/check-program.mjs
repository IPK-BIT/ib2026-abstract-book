#!/usr/bin/env node

/**
 * check-program.mjs
 *
 * Sanity-checks the conference schedule data (src/content/schedule/program.json
 * by default) for structural problems and plausibility issues that Zod's
 * schema validation (see src/content.config.ts) won't catch — things like
 * overlapping sessions, contribution durations that don't add up, duplicate
 * abstract links, or talks quietly missing a speaker.
 *
 * Usage:
 *   node ./scripts/check-program.mjs [path-to-program.json]
 *
 * Exit code:
 *   0 - no errors (warnings may still be present)
 *   1 - at least one error found, or the file could not be read/parsed
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_PATH = 'src/content/schedule/program.json';
const filePath = process.argv[2] ?? DEFAULT_PATH;

const VALID_TYPES = new Set(['Keynote', 'Full Talk', 'Poster', 'Panel', 'Break']);
const PLACEHOLDER = 'TBD';

const errors = [];
const warnings = [];
const placeholders = [];

const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// --- time helpers -----------------------------------------------------

const TIME_RANGE_RE = /^\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*$/;

function parseTimeToMinutes(time, context) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    err(`${context}: "${time}" is not a valid "HH:MM" time`);
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    err(`${context}: "${time}" is out of range for a time of day`);
    return null;
  }
  return hours * 60 + minutes;
}

function parseTimeRange(range, context) {
  if (!TIME_RANGE_RE.test(range)) {
    err(`${context}: "${range}" is not a valid "HH:MM - HH:MM" range`);
    return null;
  }
  const [startStr, endStr] = range.split('-').map((s) => s.trim());
  const start = parseTimeToMinutes(startStr, context);
  const end = parseTimeToMinutes(endStr, context);
  if (start === null || end === null) return null;
  if (end <= start) {
    err(`${context}: end time (${endStr}) is not after start time (${startStr})`);
    return null;
  }
  return { start, end };
}

function formatMinutes(total) {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// --- plausibility checks ------------------------------------------------

function checkPoster(poster, context) {
  if (!poster.title) err(`${context}: poster is missing a title`);
  if (poster.title === PLACEHOLDER) placeholders.push(`${context}: title`);
  if (!poster.speaker) warn(`${context}: poster has no speaker`);
  else if (poster.speaker === PLACEHOLDER) placeholders.push(`${context}: speaker`);
  if (!poster.abstractSlug) warn(`${context}: poster has no abstractSlug`);
}

function checkContribution(contrib, context, registerSlug) {
  if (typeof contrib.durationMinutes !== 'number' || contrib.durationMinutes <= 0) {
    err(`${context}: durationMinutes must be a positive number (got ${JSON.stringify(contrib.durationMinutes)})`);
  }
  if (!contrib.title) err(`${context}: missing title`);
  if (contrib.title === PLACEHOLDER) placeholders.push(`${context}: title`);

  if (!contrib.type) {
    err(`${context}: missing type`);
  } else if (!VALID_TYPES.has(contrib.type)) {
    err(`${context}: unknown type "${contrib.type}"`);
  }

  const isBreak = contrib.type === 'Break';
  const isPoster = contrib.type === 'Poster';

  if (isPoster) {
    if (!contrib.posters || contrib.posters.length === 0) {
      warn(`${context}: type is "Poster" but has no posters array — did you forget to fill it in?`);
    } else {
      if (contrib.posters.length < 3) {
        warn(`${context}: only ${contrib.posters.length} poster(s) listed — unusually few for a Poster Pitches slot, double check nothing is missing`);
      }
      if (contrib.posters.length > 10) {
        warn(`${context}: ${contrib.posters.length} posters listed — unusually many, double check for accidental duplicates`);
      }
      contrib.posters.forEach((poster, i) => {
        checkPoster(poster, `${context} > poster #${i + 1} ("${poster.title ?? 'untitled'}")`);
        if (poster.abstractSlug) registerSlug(poster.abstractSlug, `${context} > poster #${i + 1}`);
      });
    }
    // A Poster Pitches contribution itself typically has no single speaker/abstractSlug —
    // that's expected, so we don't warn about those being absent here.
    return;
  }

  if (!isBreak) {
    if (!contrib.speaker) {
      warn(`${context}: non-break contribution has no speaker`);
    } else if (contrib.speaker === PLACEHOLDER) {
      placeholders.push(`${context}: speaker`);
    }
    if (!contrib.abstractSlug) {
      warn(`${context}: non-break contribution has no abstractSlug`);
    }
  }

  if (contrib.abstractSlug) registerSlug(contrib.abstractSlug, context);
}

function checkSlot(slot, dayLabel, index, registerSlug) {
  const context = `${dayLabel} / slot #${index + 1} ("${slot.title ?? 'untitled'}")`;

  if (!slot.title) err(`${context}: missing title`);
  if (!slot.time) {
    err(`${context}: missing time`);
    return null;
  }

  const range = parseTimeRange(slot.time, context);

  if (slot.contributions && slot.contributions.length > 0) {
    let cursor = range ? range.start : null;
    slot.contributions.forEach((contrib, i) => {
      const contribContext = `${context} > contribution #${i + 1} ("${contrib.title ?? 'untitled'}")`;
      checkContribution(contrib, contribContext, registerSlug);
      if (cursor !== null && typeof contrib.durationMinutes === 'number' && contrib.durationMinutes > 0) {
        cursor += contrib.durationMinutes;
      }
    });

    if (range && cursor !== null && cursor !== range.end) {
      warn(
        `${context}: contributions add up to ${formatMinutes(cursor)}, but the slot's own time range ends at ${formatMinutes(range.end)} ` +
        `(${cursor < range.end ? 'a gap of' : 'overshoots by'} ${Math.abs(range.end - cursor)} min) — check the slot's "time" field or a contribution's durationMinutes`
      );
    }
  }

  return range;
}

function checkDay(day, dayIndex) {
  const dayLabel = `Day ${dayIndex + 1} (${day.label ?? day.date ?? '?'})`;

  if (!day.date) err(`${dayLabel}: missing date`);
  if (!day.label) err(`${dayLabel}: missing label`);
  if (!day.slots || day.slots.length === 0) {
    warn(`${dayLabel}: has no slots`);
    return;
  }

  const registerSlug = makeSlugRegistrar();
  const ranges = [];

  day.slots.forEach((slot, i) => {
    const range = checkSlot(slot, dayLabel, i, registerSlug.add);
    if (range) ranges.push({ ...range, title: slot.title, index: i });
  });

  // Chronological order + overlap check across top-level slots in the day
  for (let i = 1; i < ranges.length; i++) {
    const prev = ranges[i - 1];
    const curr = ranges[i];
    if (curr.start < prev.start) {
      warn(
        `${dayLabel}: slot #${curr.index + 1} ("${curr.title}") starts at ${formatMinutes(curr.start)}, ` +
        `before slot #${prev.index + 1} ("${prev.title}") which starts at ${formatMinutes(prev.start)} — slots look out of order`
      );
    } else if (curr.start < prev.end) {
      warn(
        `${dayLabel}: slot #${curr.index + 1} ("${curr.title}", starts ${formatMinutes(curr.start)}) overlaps with ` +
        `slot #${prev.index + 1} ("${prev.title}", ends ${formatMinutes(prev.end)})`
      );
    }
  }

  registerSlug.reportDuplicates(dayLabel);
}

function makeSlugRegistrar() {
  const seen = new Map();
  return {
    add(slug, context) {
      if (!seen.has(slug)) seen.set(slug, []);
      seen.get(slug).push(context);
    },
    reportDuplicates(dayLabel) {
      for (const [slug, contexts] of seen) {
        if (contexts.length > 1) {
          warn(`${dayLabel}: abstractSlug "${slug}" is used ${contexts.length} times — likely a copy-paste mistake:\n    - ${contexts.join('\n    - ')}`);
        }
      }
    },
  };
}

// Cross-day duplicate abstractSlug check (in case the same slug is reused
// across two different days, which per-day checks above wouldn't catch)
function checkGlobalSlugs(program) {
  const seen = new Map();
  const record = (slug, context) => {
    if (!seen.has(slug)) seen.set(slug, []);
    seen.get(slug).push(context);
  };

  program.days.forEach((day, dayIndex) => {
    const dayLabel = `Day ${dayIndex + 1} (${day.label ?? day.date ?? '?'})`;
    (day.slots ?? []).forEach((slot, slotIndex) => {
      (slot.contributions ?? []).forEach((contrib, contribIndex) => {
        const context = `${dayLabel} / slot #${slotIndex + 1} > contribution #${contribIndex + 1}`;
        if (contrib.abstractSlug) record(contrib.abstractSlug, context);
        (contrib.posters ?? []).forEach((poster, posterIndex) => {
          if (poster.abstractSlug) record(poster.abstractSlug, `${context} > poster #${posterIndex + 1}`);
        });
      });
    });
  });

  for (const [slug, contexts] of seen) {
    if (contexts.length > 1) {
      warn(`abstractSlug "${slug}" is used ${contexts.length} times across the whole program:\n    - ${contexts.join('\n    - ')}`);
    }
  }
}

// --- main -----------------------------------------------------------------

async function main() {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  let raw;
  try {
    raw = await readFile(resolvedPath, 'utf-8');
  } catch (e) {
    console.error(`✖ Could not read ${resolvedPath}: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  let program;
  try {
    program = JSON.parse(raw);
  } catch (e) {
    console.error(`✖ ${resolvedPath} is not valid JSON: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(program.days)) {
    console.error(`✖ ${resolvedPath}: expected a top-level "days" array`);
    process.exitCode = 1;
    return;
  }

  program.days.forEach((day, i) => checkDay(day, i));
  checkGlobalSlugs(program);

  console.log(`Checked ${resolvedPath}\n`);

  if (placeholders.length > 0) {
    console.log(`ℹ ${placeholders.length} placeholder ("${PLACEHOLDER}") value(s) still pending:`);
    placeholders.forEach((p) => console.log(`  - ${p}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`⚠ ${warnings.length} plausibility warning(s):`);
    warnings.forEach((w) => console.log(`  - ${w}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log(`✖ ${errors.length} error(s):`);
    errors.forEach((e) => console.log(`  - ${e}`));
    console.log('');
    process.exitCode = 1;
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✔ No structural errors or plausibility issues found.');
  } else if (errors.length === 0) {
    console.log('✔ No structural errors. Review the warnings above before publishing.');
  }
}

main();
