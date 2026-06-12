export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    hasId: !!process.env.SPOTIFY_CLIENT_ID,
    hasSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    hasRefresh: !!process.env.SPOTIFY_REFRESH_TOKEN,
    idLength: (process.env.SPOTIFY_CLIENT_ID || '').length,
    secretLength: (process.env.SPOTIFY_CLIENT_SECRET || '').length,
    refreshLength: (process.env.SPOTIFY_REFRESH_TOKEN || '').length
  });
}
