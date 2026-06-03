export default async function handler(req, res) {
  const { steamid, type } = req.query;
  const STEAM_API_KEY = process.env.STEAM_API_KEY;

  if (!steamid) {
    return res.status(400).json({ error: 'Steam ID required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    let url;
    if (type === 'owned') {
      url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamid}&include_appinfo=true&include_played_free_games=true&include_extended_appinfo=true`;
    } else {
      url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamid}&count=5`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.response && data.response.games) {
      const games = data.response.games.map(g => ({
        appid: g.appid,
        name: g.name || 'Unknown',
        playtime_forever: g.playtime_forever || 0,
        playtime_2weeks: g.playtime_2weeks || 0,
        rtime_last_played: g.rtime_last_played || 0,
        img_icon_url: g.img_icon_url || '',
        has_achievements: g.has_community_visible_stats || false,
        achievements_earned: g.achievements_earned || 0,
        achievements_total: g.achievements_total || 0
      }));
      res.status(200).json({ games });
    } else {
      res.status(200).json({ games: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
