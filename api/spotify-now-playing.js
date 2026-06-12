export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  const steps = [];

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(500).json({ error: 'Missing env vars', hasId: !!clientId, hasSecret: !!clientSecret, hasRefresh: !!refreshToken });
  }

  try {
    steps.push('starting token refresh');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=refresh_token&refresh_token=' + refreshToken
    });
    steps.push('token response status: ' + tokenRes.status);
    const tokenText = await tokenRes.text();
    steps.push('token response length: ' + tokenText.length);
    steps.push('token response first 100 chars: ' + tokenText.substring(0, 100));
    
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
      steps.push('token parsed ok');
    } catch(e) {
      return res.status(500).json({ error: 'Token not JSON', steps: steps, raw: tokenText.substring(0, 300) });
    }

    if (tokenData.error) {
      return res.status(500).json({ error: 'Token error', steps: steps, spotifyError: tokenData.error, description: tokenData.error_description });
    }

    steps.push('got access token, calling playback API');
    const playbackRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
    });
    steps.push('playback status: ' + playbackRes.status);
    
    if (playbackRes.status === 204) {
      return res.status(200).json({ playing: false, steps: steps });
    }

    const playbackText = await playbackRes.text();
    steps.push('playback response length: ' + playbackText.length);
    
    if (!playbackText) {
      return res.status(200).json({ playing: false, steps: steps });
    }

    const playback = JSON.parse(playbackText);
    steps.push('playback parsed ok');
    
    res.status(200).json({
      playing: true,
      track: playback.item?.name || 'unknown',
      artist: playback.item?.artists?.map(a => a.name).join(', ') || 'unknown',
      url: playback.item?.external_urls?.spotify || '',
      steps: steps
    });
  } catch (error) {
    res.status(500).json({ error: 'Exception', message: error.message, steps: steps });
  }
}
