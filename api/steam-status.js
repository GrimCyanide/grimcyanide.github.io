export default async function handler(req, res) {
  const { steamid } = req.query;
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
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamid}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.response && data.response.players && data.response.players.length > 0) {
      const player = data.response.players[0];
      const online = player.personastate !== 0;
      res.status(200).json({ 
        online: online, 
        personastate: player.personastate,
        game: player.gameextrainfo || null
      });
    } else {
      res.status(200).json({ online: false, game: null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
