export default async function handler(req, res) {
  const { channel } = req.query;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  try {
    const playlistsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channel}&maxResults=50&key=${YOUTUBE_API_KEY}`
    );
    const playlistsData = await playlistsResponse.json();
    
    if (!playlistsData.items || playlistsData.items.length === 0) {
      return res.status(404).json({ error: 'No playlists found for this channel' });
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
