module.exports = async (req, res) => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('API Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch IP location data' });
  }
}; 