// Cache the sheet data to avoid hitting Google's servers too often
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=600'); // 10 min browser cache

  try {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (cachedData && (now - lastFetch) < CACHE_DURATION) {
      return res.status(200).json(cachedData);
    }

    // Google Sheets public CSV export URL
    // Your sheet ID: 1kihHj41UtODjzqmAZwScCha_9kjBPe2XJPx87_mWXFA
    // GID 1738388228 is the specific tab
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1kihHj41UtODjzqmAZwScCha_9kjBPe2XJPx87_mWXFA/export?format=csv&gid=1738388228';
    
    const response = await fetch(sheetUrl);
    
    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV (handle basic CSV with possible quoted fields)
    const rows = parseCSV(csvText);
    
    // Skip header row (first row is column names)
    const games = rows.slice(1).map(row => {
      // Columns: GAME | Is Finished? | Rating out of 10 | Date Started | Date Finished | LINK | Parts
      const gameName = row[0]?.trim() || '';
      const isFinished = row[1]?.trim() || '';
      const rating = row[2]?.trim() || '';
      const dateStarted = row[3]?.trim() || '';
      const dateFinished = row[4]?.trim() || '';
      const linkUrl = extractUrl(row[5]) || '';
      const linkText = extractLinkText(row[5]) || '';
      const parts = row[6]?.trim() || '1';
      
      // Only return rows that have a game name
      if (!gameName) return null;
      
      return {
        game: gameName,
        isFinished: isFinished.includes('Finished') ? 'Finished' : 'Unfinished',
        isFinishedRaw: isFinished, // Keep original for display if needed
        rating: parseFloat(rating) || 0,
        ratingDisplay: rating || 'N/A',
        dateStarted: dateStarted,
        dateFinished: dateFinished,
        linkUrl: linkUrl,
        linkText: linkText || (linkUrl.includes('playlist') ? 'PLAYLIST' : 'FULL PLAYTHROUGH'),
        parts: parseInt(parts) || 1,
        partsDisplay: parts || '1'
      };
    }).filter(game => game !== null);
    
    const result = { 
      games,
      total: games.length,
      lastUpdated: new Date().toISOString()
    };
    
    // Update cache
    cachedData = result;
    lastFetch = now;
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('VODs Sheet Error:', error);
    
    // Return cached data if available (even if expired) on error
    if (cachedData) {
      return res.status(200).json({ ...cachedData, fromCache: true });
    }
    
    res.status(500).json({ error: 'Failed to fetch VODs data', message: error.message });
  }
}

// Simple CSV parser
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
        i++; // skip next quote
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
        // skip carriage return, handle on \n
      } else {
        currentField += char;
      }
    }
  }
  
  // Push last field/row if exists
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  
  return rows;
}

// Extract URL from a possible hyperlink formula or plain text
function extractUrl(cellContent) {
  if (!cellContent) return '';
  
  // Check if it's a Google Sheets HYPERLINK formula: =HYPERLINK("url","text")
  const hyperlinkMatch = cellContent.match(/=HYPERLINK\("([^"]+)"/);
  if (hyperlinkMatch) {
    return hyperlinkMatch[1];
  }
  
  // Check if it's just a plain URL
  const urlMatch = cellContent.match(/(https?:\/\/[^\s"]+)/);
  if (urlMatch) {
    return urlMatch[0];
  }
  
  return '';
}

// Extract display text from a hyperlink formula
function extractLinkText(cellContent) {
  if (!cellContent) return '';
  
  // Check for Google Sheets HYPERLINK formula
  const hyperlinkMatch = cellContent.match(/=HYPERLINK\("[^"]+","([^"]+)"\)/);
  if (hyperlinkMatch) {
    return hyperlinkMatch[1];
  }
  
  return cellContent;
}
