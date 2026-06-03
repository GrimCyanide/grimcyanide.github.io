export default async function handler(req, res) {
  const { steamid, appid } = req.query;
  const STEAM_API_KEY = process.env.STEAM_API_KEY;

  if (!steamid || !appid) {
    return res.status(400).json({ error: 'Steam ID and App ID required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamid}&appid=${appid}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.playerstats && data.playerstats.achievements) {
      res.status(200).json({ 
        gameName: data.playerstats.gameName || 'Unknown',
        achievements: data.playerstats.achievements 
      });
    } else {
      res.status(200).json({ gameName: 'Unknown', achievements: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
