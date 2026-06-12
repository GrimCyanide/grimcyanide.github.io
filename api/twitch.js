export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  const { endpoint, channel } = req.query;
  try {
    if (endpoint === 'streams') {
      const response = await fetch(`https://www.twitch.tv/${channel}`);
      const isLive = response.url.includes('/videos') ? false : true;
      res.status(200).json({
        data: isLive ? [{ is_live: true }] : []
      });
      
    } else if (endpoint === 'videos') {
      res.status(200).json({
        data: []
      });
    } else {
      res.status(400).json({ error: 'Invalid endpoint' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
