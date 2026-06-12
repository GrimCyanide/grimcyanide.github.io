export default async function handler(req, res) {
  const { channel } = req.query;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=60');

  if (!channel) {
    return res.status(400).json({ error: 'Channel required' });
  }

  try {
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
    });
    const tokenData = await tokenRes.json();

    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_login=${channel}`, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    const streamData = await streamRes.json();
    const isLive = streamData.data && streamData.data.length > 0;

    let lastStreamDate = null;
    if (!isLive) {
      const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      const userData = await userRes.json();
      if (userData.data && userData.data.length > 0) {
        const userId = userData.data[0].id;
        const videosRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=1`, {
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });
        const videosData = await videosRes.json();
        if (videosData.data && videosData.data.length > 0) {
          lastStreamDate = videosData.data[0].created_at;
        }
      }
    }

    res.status(200).json({ isLive, lastStreamDate });
  } catch (error) {
    console.error('Twitch status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
}
