export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=10');

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(500).json({ error: 'Spotify not configured' });
  }

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
      },
      body: 'grant_type=refresh_token&refresh_token=' + refreshToken
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(500).json({ error: 'Token refresh failed', details: tokenData.error });
    }

    const playbackRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
    });

    if (playbackRes.status === 204 || playbackRes.status === 200 && !playbackRes.body) {
      return res.status(200).json({ playing: false });
    }

    const playback = await playbackRes.json();

    if (!playback.item) {
      return res.status(200).json({ playing: false });
    }

    res.status(200).json({
      playing: true,
      track: playback.item.name,
      artist: playback.item.artists.map(a => a.name).join(', '),
      url: playback.item.external_urls.spotify,
      albumArt: playback.item.album.images[0]?.url || ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch', message: error.message });
  }
}
