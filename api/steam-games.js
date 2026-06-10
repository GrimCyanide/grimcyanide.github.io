export default async function handler(req, res) {
  let { steamid, type } = req.query;
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
    if (!/^\d+$/.test(steamid)) {
      const resolveUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${steamid}`;
      const resolveResponse = await fetch(resolveUrl);
      const resolveData = await resolveResponse.json();
      if (resolveData.response && resolveData.response.success === 1) {
        steamid = resolveData.response.steamid;
      } else {
        return res.status(400).json({ error: 'Could not resolve Steam ID from that URL' });
      }
    }

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
      const appIds = games.map(g => g.appid).join(',');
      let prices = {};
      
      if (appIds && type === 'owned') {
        try {
          const priceResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appIds}&filters=price_overview`);
          const priceData = await priceResponse.json();
          for (const [id, info] of Object.entries(priceData)) {
            if (info.success && info.data && info.data.price_overview) {
              prices[id] = {
                initial: (info.data.price_overview.initial / 100).toFixed(2),
                final: (info.data.price_overview.final / 100).toFixed(2),
                discount: info.data.price_overview.discount_percent
              };
            }
          }
        } catch(e) {}
      }

      res.status(200).json({ games, prices, resolvedId: steamid });
    } else {
      res.status(200).json({ games: [], prices: {}, resolvedId: steamid });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
