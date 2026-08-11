const STORAGE_KEY = 'ib-highlights';
export const HIGHLIGHTS_EVENT = 'highlights:changed';

function safeParse(json) {
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getHighlights() {
  if (typeof localStorage === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function isHighlighted(id) {
  return getHighlights().some((item) => item.id === id);
}

export function toggleHighlight(id, title, meta = {}) {
  const current = getHighlights();
  const exists = current.some((item) => item.id === id);
  const next = exists
    ? current.filter((item) => item.id !== id)
    : [...current, { id, title: title || id, savedAt: Date.now(), ...meta }];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent(HIGHLIGHTS_EVENT, { detail: { id, saved: !exists } })
  );
  return !exists;
}

export function removeHighlight(id) {
  const next = getHighlights().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent(HIGHLIGHTS_EVENT, { detail: { id, saved: false } })
  );
}