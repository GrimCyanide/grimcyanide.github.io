export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { endpoint, channel } = req.query;
  const clientId = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; // Twitch's public client ID

  try {
    let url;
    
    if (endpoint === 'streams') {
      url = `https://api.twitch.tv/helix/streams?user_login=${channel}`;
    } else if (endpoint === 'videos') {
      // Get user ID first
      const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, {
        headers: { 'Client-ID': clientId }
      });
      const userData = await userResponse.json();
      const userId = userData.data[0].id;
      
      url = `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=5`;
    } else {
      return res.status(400).json({ error: 'Invalid endpoint' });
    }

    const response = await fetch(url, {
      headers: { 'Client-ID': clientId }
    });
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
