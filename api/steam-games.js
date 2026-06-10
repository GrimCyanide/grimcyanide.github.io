export default async function handler(req, res) {
  const { steamid, type } = req.query;
  const STEAM_API_KEY = process.env.STEAM_API_KEY;

  if (!steamid) {
    return res.status(400).json({ error: 'Steam ID required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let url;
    if (type === 'owned') {
      url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamid}&include_appinfo=true&include_played_free_games=true`;
    } else {
      url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamid}&count=5`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.response && data.response.games) {
      const games = data.response.games;
      res.status(200).json({ games, prices: {} });
    } else {
      res.status(200).json({ games: [], prices: {} });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
