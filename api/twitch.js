export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { endpoint, channel } = req.query;

  try {
    // Get an access token first
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        client_secret: 'kk1tqcbp2v2t2l2vuoic2m9qdkd6ot',
        grant_type: 'client_credentials',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    let url;
    
    if (endpoint === 'streams') {
      url = `https://api.twitch.tv/helix/streams?user_login=${channel}`;
    } else if (endpoint === 'videos') {
      // Get user ID first
      const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, {
        headers: {
          'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      const userData = await userResponse.json();
      
      if (!userData.data || userData.data.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userId = userData.data[0].id;
      url = `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=5`;
    } else {
      return res.status(400).json({ error: 'Invalid endpoint' });
    }

    const response = await fetch(url, {
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
