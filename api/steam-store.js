export default async function handler(req, res) {
  const { appid } = req.query;
  
  if (!appid) {
    return res.status(400).json({ error: 'App ID required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}
