let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 10 * 60 * 1000;
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=600');
  try {
    const now = Date.now();
    if (cachedData && (now - lastFetch) < CACHE_DURATION) {
      return res.status(200).json(cachedData);
    }
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuZqj6SawJ3Ul1PAmptF9mWehQeQ_fNSEwJ4MfdiFCdovs6-DATiRCbzspS1f0AX7SWArn9gp5jGRW/pub?gid=1738388228&single=true&output=csv';
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}`);
    }
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    const games = rows.slice(1).map(row => {
      const gameName = row[0]?.trim() || '';
      const isFinished = row[1]?.trim() || '';
      const rating = row[2]?.trim() || '';
      const dateStarted = row[3]?.trim() || '';
      const dateFinished = row[4]?.trim() || '';
      const linkText = row[5]?.trim() || '';
      const parts = row[6]?.trim() || '';
      const linkUrl = row[7]?.trim() || '';
      const poster = row[8]?.trim() || '';
      if (!gameName) return null;
      return {
        game: gameName,
        isFinished: isFinished.includes('Finished') ? 'Finished' : 'Unfinished',
        isFinishedRaw: isFinished,
        rating: parseFloat(rating) || 0,
        ratingDisplay: rating || '',
        dateStarted: dateStarted,
        dateFinished: dateFinished,
        linkUrl: linkUrl,
        linkText: linkText || '',
        parts: parts ? (parseInt(parts) || 0) : 0,
        partsDisplay: parts || '',
        poster: poster
      };
    }).filter(game => game !== null);
    const result = { 
      games,
      total: games.length,
      lastUpdated: new Date().toISOString()
    };
    cachedData = result;
    lastFetch = now;
    res.status(200).json(result);
  } catch (error) {
    console.error('VODs Sheet Error:', error);
    if (cachedData) {
      return res.status(200).json({ ...cachedData, fromCache: true });
    }
    res.status(500).json({ error: 'Failed to fetch VODs data', message: error.message });
  }
}
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\r') {
      } else {
        currentField += char;
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}
