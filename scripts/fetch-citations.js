// scripts/fetch-citations.js
import fs from 'fs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchCitations() {
  const apiKey = process.env.OPENALEX_API_KEY;

  if (!apiKey) {
    console.warn("Warning: No OPENALEX_API_KEY environment variable detected. Running with standard unauthenticated limits.");
  }
  
  // 1. Read the .bib file
  let bibFileContent;
  try {
    bibFileContent = fs.readFileSync('./src/content/references/collection.bib', 'utf8');
  } catch (error) {
    console.error("Could not find collection.bib at ./src/content/references/collection.bib");
    process.exit(1);
  }

  // 2. Extract DOIs using a robust regex pattern matching doi = {...} or doi = "..."
  const doiRegex = /\bdoi\s*=\s*(?:["{])([^"'}\]]+)(?:["}])/gi;
  const dois = [];
  let match;

  while ((match = doiRegex.exec(bibFileContent)) !== null) {
    if (match[1]) {
      const cleaned = match[1].replace(/^https?:\/\/doi\.org\//i, '').trim();
      if (cleaned) dois.push(cleaned);
    }
  }

  const uniqueDois = [...new Set(dois)];
  const citationMap = {};

  if (uniqueDois.length === 0) {
    console.log("No DOIs found in collection.bib");
    fs.writeFileSync('./src/data/citations.json', JSON.stringify({}));
    return;
  }

  console.log(`Found ${uniqueDois.length} unique DOIs. Fetching one-by-one from OpenAlex...`);

  // 3. Look up each DOI individually using the singleton endpoint with the API key
  let successCount = 0;
  for (const doi of uniqueDois) {
    let url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`;
    if (apiKey) {
      url += `?api-key=${apiKey}`;
    }
    
    try {
      const response = await fetch(url);
      
      if (response.status === 404) {
        citationMap[doi] = 0;
        continue;
      }
      
      if (!response.ok) {
        console.warn(`Warning: Failed to fetch DOI ${doi} (Status ${response.status})`);
        citationMap[doi] = 0;
        continue;
      }
      
      const data = await response.json();
      citationMap[doi] = data.cited_by_count ?? 0;
      successCount++;

      // Brief polite pause between requests (50ms)
      await sleep(50);
    } catch (error) {
      console.error(`Error fetching DOI ${doi}:`, error.message);
      citationMap[doi] = 0;
    }
  }

  // 4. Ensure target directory exists and write results JSON
  if (!fs.existsSync('./src/data')) {
    fs.mkdirSync('./src/data', { recursive: true });
  }
  
  fs.writeFileSync('./src/data/citations.json', JSON.stringify(citationMap, null, 2));
  console.log(`Successfully cached citation counts for ${successCount}/${uniqueDois.length} references.`);
}

fetchCitations();