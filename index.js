// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { connectToDatabase, getPool } = require('./sql'); // Import the DB module
const sql = require('mssql'); // SQL Server library

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to SQL Server before starting the API
connectToDatabase();

// API to fetch places from Google Places API and store in SQL Server
app.get('/api/places', async (req, res) => {
    const { lat, lng, radius, keyword, limit = 5 } = req.query; // Default limit to 5

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

        // Map the places to the format you want
        const places = placesResponse.data.results.map(place => ({
            name: place.name,
            address: place.vicinity,
            rating: place.rating || null,
            userRatingsTotal: place.user_ratings_total || null,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            priceLevel: place.price_level || null
        }));

        // Limit the number of results based on the user-defined `limit`
        const limitedPlaces = places.slice(0, parseInt(limit));

        const pool = getPool();
        if (!pool) {
            return res.status(500).json({ error: 'Database connection not established' });
        }

        // Clear the Restaurants table
        await pool.request().query(`DELETE FROM Restaurants`);

        // Use Promise.all to insert places concurrently
        const insertPromises = limitedPlaces.map(place => {
            return pool.request()
                .input('name', sql.NVarChar, place.name)
                .input('address', sql.NVarChar, place.address)
                .input('rating', sql.Float, place.rating)
                .input('userRatingsTotal', sql.Int, place.userRatingsTotal)
                .input('latitude', sql.Float, place.latitude)
                .input('longitude', sql.Float, place.longitude)
                .input('priceLevel', sql.Int, place.priceLevel)
                .query(`
                    INSERT INTO Restaurants (Name, Address, Rating, UserRatingsTotal, Latitude, Longitude, PriceLevel)
                    VALUES (@name, @address, @rating, @userRatingsTotal, @latitude, @longitude, @priceLevel)
                `);
        });

        // Wait for all insert operations to complete
        await Promise.all(insertPromises);

        // Send the results back to the frontend
        res.json(limitedPlaces);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
