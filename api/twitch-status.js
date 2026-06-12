export default async function handler(req, res) {
    const { channel } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    try {
        const response = await fetch(`https://www.twitch.tv/${channel}`);
        const html = await response.text();
        const isLive = html.includes('isLiveBroadcast') || 
                      html.includes('"isLive":true') || 
                      html.includes('"status":"live"');
        res.status(200).json({ isLive });
        
    } catch (error) {
        console.error('Twitch status error:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
}
