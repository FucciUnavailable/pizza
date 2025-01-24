document.getElementById('search-btn').addEventListener('click', async () => {
    const radius = document.getElementById('radius').value;
    const keyword = document.getElementById('keyword').value;
    const limit = document.getElementById('limit').value; // Get the user-defined limit

    if (!radius || !keyword) {
        alert('Please fill out both fields!');
        return;
    }

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    // Get the user's location using Geolocation API
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        try {
            const response = await fetch(`http://localhost:5000/api/places?lat=${latitude}&lng=${longitude}&radius=${radius*1000}&keyword=${keyword}&limit=${limit}`);
            const places = await response.json();

            const placesList = document.getElementById('places-list');
            placesList.innerHTML = ''; // Clear previous results

            if (places.length === 0) {
                placesList.innerHTML = '<li>No results found!</li>';
                return;
            }

            places.forEach(place => {
                const li = document.createElement('li');
                let priceLevel = place.priceLevel;
                if(priceLevel){priceLevel = '$'.repeat(priceLevel);}
                li.innerHTML = `<strong>${place.name}</strong><br>${priceLevel}$<br>${place.address}<br>Rating: ${place.rating || 'N/A'} (${place.userRatingsTotal || 0} reviews)`;
                placesList.appendChild(li);
            });
        } catch (err) {
            console.error('Error fetching places:', err);
            alert('Something went wrong!');
        }
    }, () => {
        alert('Unable to retrieve your location.');
    });
});
