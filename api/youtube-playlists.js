export default async function handler(req, res) {
  const { channel } = req.query;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Your secret YouTube API key - safe in serverless environment
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  try {
    // Get channel ID from username
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${channel}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const channelId = channelData.items[0].id;
    
    // Get all playlists
    const playlistsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    );
    const playlistsData = await playlistsResponse.json();
    
    if (!playlistsData.items || playlistsData.items.length === 0) {
      return res.status(404).json({ error: 'No playlists found' });
    }
    
    const playlists = playlistsData.items.map(playlist => ({
      title: playlist.snippet.title,
      url: `https://www.youtube.com/playlist?list=${playlist.id}`,
      count: playlist.contentDetails?.itemCount || 0
    }));
    
    res.status(200).json({ playlists });
    
  } catch (error) {
    console.error('YouTube API Error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
}
