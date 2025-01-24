require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/places', async (req, res) => {
    const { lat, lng, radius, keyword } = req.query;

    if (!lat || !lng || !radius || !keyword) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Use Places API with the latitude and longitude
        const placesResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
            params: {
                location: `${lat},${lng}`,
                radius,
                keyword,
                type: 'restaurant',
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });

        // Format and send results
        res.json(placesResponse.data.results.map(place => ({
            name: place.name,
            address: place.vicinity,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            location: place.geometry.location
        })));
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
