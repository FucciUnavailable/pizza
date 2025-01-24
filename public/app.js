let currentPage = 1;
const placesPerPage = 10; // Number of places per page

document.getElementById('search-btn').addEventListener('click', async () => {
    const radius = document.getElementById('radius').value;
    const keyword = document.getElementById('keyword').value;

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
            const response = await fetch(`http://localhost:5000/api/places?lat=${latitude}&lng=${longitude}&radius=${radius*1000}&keyword=${keyword}&page=${currentPage}&limit=${placesPerPage}`);
            const places = await response.json();

            const placesList = document.getElementById('places-list');
            placesList.innerHTML = ''; // Clear previous results

            if (places.length === 0) {
                placesList.innerHTML = '<li>No results found!</li>';
                return;
            }

            places.forEach(place => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${place.name}</strong><br>${place.priceLevel}0$<br>${place.address}<br>Rating: ${place.rating || 'N/A'} (${place.userRatingsTotal || 0} reviews)`;
                placesList.appendChild(li);
            });

            // Show "Next Page" button if there are more results
            if (places.length === placesPerPage) {
                const nextButton = document.createElement('button');
                nextButton.textContent = 'Next Page';
                nextButton.id = 'next-page-btn';
                document.body.appendChild(nextButton);

                nextButton.addEventListener('click', () => {
                    currentPage++;
                    document.getElementById('search-btn').click(); // Trigger the search again with the next page
                    nextButton.remove(); // Remove the button until it's needed again
                });
            }
        } catch (err) {
            console.error('Error fetching places:', err);
            alert('Something went wrong!');
        }
    }, () => {
        alert('Unable to retrieve your location.');
    });
});
