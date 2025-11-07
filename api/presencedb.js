export default async function handler(req, res) {
  const { type, userid } = req.query;

  if (!userid) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    let apiUrl;
    if (type === 'trending') {
      apiUrl = `https://www.presencedb.com/api/user/${userid}/trending-activities`;
    } else {
      apiUrl = `https://www.presencedb.com/api/user/${userid}`;
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
