export default async function handler(req, res) {
  const { steamid, appid } = req.query;
  const STEAM_API_KEY = process.env.STEAM_API_KEY;

  if (!steamid || !appid) {
    return res.status(400).json({ error: 'Steam ID and App ID required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const [playerRes, schemaRes] = await Promise.all([
      fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamid}&appid=${appid}&l=en`),
      fetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?key=${STEAM_API_KEY}&appid=${appid}&l=english&format=json`)
    ]);

    const playerData = await playerRes.json();
    const schemaData = await schemaRes.json();

    const playerAchievements = playerData.playerstats?.achievements || [];
    const schemaAchievements = schemaData.game?.availableGameStats?.achievements || [];

    const schemaMap = {};
    schemaAchievements.forEach(a => {
      schemaMap[a.name] = {
        displayName: a.displayName,
        description: a.description,
        icon: a.icon,
        icongray: a.icongray
      };
    });

    const achievements = playerAchievements.map(a => ({
      apiname: a.apiname,
      achieved: a.achieved,
      unlocktime: a.unlocktime,
      name: schemaMap[a.apiname]?.displayName || a.name,
      description: schemaMap[a.apiname]?.description || a.description,
      icon: schemaMap[a.apiname]?.icon || '',
      icongray: schemaMap[a.apiname]?.icongray || ''
    }));

    res.status(200).json({
      gameName: playerData.playerstats?.gameName || 'Unknown',
      achievements
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
