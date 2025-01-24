require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sql = require('mssql'); // SQL Server library

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// SQL Server connection configuration
const sqlConfig = {
    user: process.env.DB_USER,          // Your SQL Server username
    password: process.env.DB_PASSWORD,  // Your SQL Server password
    database: process.env.DB_NAME,      // Your database name
    server: process.env.DB_SERVER,      // Your server name or IP
    options: {
        encrypt: true,                  // Set to false if not using Azure
        trustServerCertificate: true    // Required for self-signed certs
    }
};

app.get('/api/places', async (req, res) => {
    const { lat, lng, radius, keyword } = req.query;

    if (!lat || !lng || !radius || !keyword) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Fetch places from Google Places API
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

        const places = placesResponse.data.results.map(place => ({
            name: place.name,
            address: place.vicinity,
            rating: place.rating || null,
            userRatingsTotal: place.user_ratings_total || null,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            priceLevel: place.price_level || null // Include price_level
        }));

        // Connect to SQL Server
        const pool = await sql.connect(sqlConfig);

        // Clear the Restaurants table
        await pool.request().query(`DELETE FROM Restaurants`);

        // Insert new data
        for (const place of places) {
            await pool.request()
                .input('name', sql.NVarChar, place.name)
                .input('address', sql.NVarChar, place.address)
                .input('rating', sql.Float, place.rating)
                .input('userRatingsTotal', sql.Int, place.userRatingsTotal)
                .input('latitude', sql.Float, place.latitude)
                .input('longitude', sql.Float, place.longitude)
                .input('priceLevel', sql.Int, place.priceLevel) // Insert price_level
                .query(`
                    INSERT INTO Restaurants (Name, Address, Rating, UserRatingsTotal, Latitude, Longitude, PriceLevel)
                    VALUES (@name, @address, @rating, @userRatingsTotal, @latitude, @longitude, @priceLevel)
                `);
        }

        // Send the results back to the frontend
        res.json(places);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
