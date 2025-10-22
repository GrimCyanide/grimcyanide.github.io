export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { endpoint, channel } = req.query;

  try {
    if (endpoint === 'streams') {
      // Simple stream check - fetch the channel page
      const response = await fetch(`https://www.twitch.tv/${channel}`);
      const isLive = response.url.includes('/videos') ? false : true;
      
      res.status(200).json({
        data: isLive ? [{ is_live: true }] : []
      });
      
    } else if (endpoint === 'videos') {
      // For VODs, we'll use a placeholder for now
      // Getting actual VOD data requires more complex scraping
      res.status(200).json({
        data: [] // Empty for now
      });
    } else {
      res.status(400).json({ error: 'Invalid endpoint' });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
