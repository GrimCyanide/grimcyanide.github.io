export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=10');

  const apiKey = process.env.LASTFM_API_KEY;
  const username = 'grimcyanide';

  if (!apiKey) {
    return res.status(500).json({ error: 'Last.fm not configured' });
  }

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
      return res.status(200).json({ playing: false });
    }

    const track = data.recenttracks.track[0];
    const isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

    res.status(200).json({
      playing: isPlaying,
      track: track.name,
      artist: track.artist['#text'],
      url: track.url,
      albumArt: track.image?.length > 0 ? track.image[track.image.length - 1]['#text'] : ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
}
