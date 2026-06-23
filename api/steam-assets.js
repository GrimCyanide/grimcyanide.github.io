export default async function handler(req, res) {
  const { appids } = req.query;
  const STEAM_API_KEY = process.env.STEAM_API_KEY;

  if (!appids) {
    return res.status(400).json({ error: 'App IDs required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  try {
    const ids = appids.split(',').map(id => ({ appid: parseInt(id) }));
    const inputJson = JSON.stringify({
      ids,
      context: { country_code: 'GB' },
      data_request: { include_assets: true }
    });

    const url = `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?key=${STEAM_API_KEY}&input_json=${encodeURIComponent(inputJson)}`;
    const response = await fetch(url);
    const data = await response.json();

    const result = {};
    if (data.response?.store_items) {
      data.response.store_items.forEach(item => {
        if (item.success && item.assets) {
          const base = 'https://shared.fastly.steamstatic.com/store_item_assets/';
          result[item.appid] = {
            library_capsule: item.assets.library_capsule ? `${base}${item.assets.asset_url_format.replace('${FILENAME}', item.assets.library_capsule)}` : null,
            library_hero: item.assets.library_hero ? `${base}${item.assets.asset_url_format.replace('${FILENAME}', item.assets.library_hero)}` : null,
            header: item.assets.header ? `${base}${item.assets.asset_url_format.replace('${FILENAME}', item.assets.header)}` : null,
            hero_capsule: item.assets.hero_capsule ? `${base}${item.assets.asset_url_format.replace('${FILENAME}', item.assets.hero_capsule)}` : null,
          };
        }
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
