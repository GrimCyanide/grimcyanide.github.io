export default async function handler(req, res) {
  const { url } = req.query;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  try {
    const playlistMatch = url.match(/[&?]list=([^&]+)/);
    const videoMatch = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);

    if (playlistMatch) {
      const playlistId = playlistMatch[1];
      let allVideos = [];
      let pageToken = '';

      do {
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${pageToken ? '&pageToken=' + pageToken : ''}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.items) {
          allVideos = allVideos.concat(data.items.map(item => ({
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            videoId: item.snippet.resourceId.videoId,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}&list=${playlistId}`
          })));
        }
        pageToken = data.nextPageToken || '';
      } while (pageToken);

      res.status(200).json({ parts: allVideos });
    } else if (videoMatch) {
      const videoId = videoMatch[1];
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        res.status(200).json({
          parts: [{
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            videoId: videoId,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${videoId}`
          }]
        });
      } else {
        res.status(200).json({ parts: [] });
      }
    } else {
      res.status(200).json({ parts: [] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}
