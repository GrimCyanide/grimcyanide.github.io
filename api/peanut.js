export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const correctPassword = process.env.PEANUT_PASSWORD || 'peanut2024';

  if (password !== correctPassword) {
    return res.status(403).json({ error: 'Incorrect password' });
  }

  const htmlUrl = process.env.PEANUT_HTML_URL;
  if (!htmlUrl) {
    return res.status(500).json({ error: 'HTML source not configured' });
  }

  try {
    const response = await fetch(htmlUrl);
    if (!response.ok) throw new Error('Failed to fetch HTML');
    const html = await response.text();
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load page content' });
  }
}
