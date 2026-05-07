let chartInstance = null;
let trendChartInstance = null;
let currentUserId = null;
let currentUserFavorites = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadOrCreateUser();
    loadUserFavorites();
    loadMostSearchedGames();
});

// User Management
async function loadOrCreateUser() {
    let userId = localStorage.getItem('userId');
    
    if (!userId) {
        // Create a new user
        const username = 'user_' + Date.now();
        try {
            const res = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username })
            });
            const user = await res.json();
            userId = user.id;
            localStorage.setItem('userId', userId);
        } catch (error) {
            console.error('Error creating user:', error);
            return;
        }
    }
    
    currentUserId = userId;
    updateUserDisplay();
}

function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = `User ID: ${currentUserId}`;
    }
}

async function loadUserFavorites() {
    if (!currentUserId) return;
    
    try {
        const res = await fetch(`http://localhost:5000/api/users/${currentUserId}/favorites`);
        if (res.ok) {
            currentUserFavorites = await res.json();
            updateFavoritesDisplay();
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

function updateFavoritesDisplay() {
    const favContainer = document.getElementById('favoritesContainer');
    if (!favContainer) return;
    
    if (currentUserFavorites.length === 0) {
        favContainer.innerHTML = '<p>No favorites yet. Click the ♡ icon on games to add them.</p>';
        return;
    }
    
    favContainer.innerHTML = '<h3>Your Favorites</h3>';
    const list = document.createElement('ul');
    list.className = 'favorites-list';
    
    currentUserFavorites.forEach(fav => {
        const item = document.createElement('li');
        item.className = 'favorite-item';
        item.innerHTML = `
            ${fav.game_name}
            <button onclick="removeFavorite(${fav.id})" class="remove-btn">Remove</button>
        `;
        list.appendChild(item);
    });
    
    favContainer.appendChild(list);
}

async function addFavorite(gameName, appId) {
    if (!currentUserId) return;
    
    try {
        const res = await fetch(`http://localhost:5000/api/users/${currentUserId}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_name: gameName, app_id: appId })
        });
        
        if (res.ok) {
            await loadUserFavorites();
            alert(`${gameName} added to favorites!`);
        } else {
            const error = await res.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error adding favorite:', error);
    }
}

async function removeFavorite(favId) {
    if (!currentUserId) return;
    
    try {
        const res = await fetch(`http://localhost:5000/api/users/${currentUserId}/favorites/${favId}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            await loadUserFavorites();
            alert('Removed from favorites!');
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
    }
}

// Most Searched Games
async function loadMostSearchedGames() {
    try {
        const res = await fetch('http://localhost:5000/api/games/most-searched?limit=10');
        if (res.ok) {
            const games = await res.json();
            displayMostSearched(games);
        }
    } catch (error) {
        console.error('Error loading most searched games:', error);
    }
}

function displayMostSearched(games) {
    const container = document.getElementById('mostSearchedContainer');
    if (!container) return;
    
    if (games.length === 0) {
        container.innerHTML = '<p>No search history yet.</p>';
        return;
    }
    
    container.innerHTML = '<h3>Most Searched Games (All Users)</h3>';
    const list = document.createElement('ol');
    
    games.forEach(game => {
        const item = document.createElement('li');
        item.textContent = `${game.game_name} - ${game.search_count} searches`;
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

function fetchGameStats() {
    const input = document.getElementById("appIdInput").value.trim();
    const loadingMsg = document.getElementById("loadingMessage");
    const tagsOutput = document.getElementById("tagsOutput");
    tagsOutput.innerHTML = "";
    
    if (!input) return alert("Enter some App IDs");

    loadingMsg.style.display = "block";

    const url = currentUserId 
        ? `http://localhost:5000/game_stats?names=${encodeURIComponent(input)}&user_id=${currentUserId}`
        : `http://localhost:5000/game_stats?names=${encodeURIComponent(input)}`;

    fetch(url)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(({ games, trends }) => {
        loadingMsg.style.display = "none";

        const labels = games.map(g => g.Title);
        const owners = games.map(g => parseOwnerRange(g.Owners));
        const players = games.map(g => g.Players_2Weeks);
        const reviews = games.map(g => g.ReviewScore);

        renderChart(labels, owners, players, reviews);
        renderTrends(trends);

        games.forEach(game => {
            const isFavorite = currentUserFavorites.some(f => f.game_name.toLowerCase() === game.Title.toLowerCase());
            tagsOutput.innerHTML += `
                <div class="game-card">
                    <h3>${game.Title}</h3>
                    <p><strong>Genres:</strong> ${game.Genres.join(', ')}</p>
                    <p><strong>Top Tags:</strong> ${game.Tags.join(', ')}</p>
                    <button onclick="addFavorite('${game.Title.replace(/'/g, "\\'")}', ${game.AppID})" 
                            class="favorite-btn ${isFavorite ? 'favorited' : ''}">
                        ${isFavorite ? '♥ Favorited' : '♡ Add to Favorites'}
                    </button>
                </div>
            `;
        });
        
        loadMostSearchedGames();
    })
    .catch(error => {
        loadingMsg.style.display = "none";
        console.error('Fetch error:', error);
        alert(`Error fetching game stats: ${error.message}. Ensure the Flask server is running on http://localhost:5000.`);
    });
        
}

function parseOwnerRange(range) {
    if (!range.includes("..")) return 0;
    const [min, max] = range.split("..").map(r => parseInt(r.replace(/\D/g, '')));
    return Math.round((min + max) / 2);
}

function renderChart(labels, owners, players, reviews) {
    const ctx = document.getElementById("statsChart").getContext("2d");
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                { label: "Estimated Owners", data: owners, backgroundColor: "rgba(75,192,192,0.6)" },
                { label: "Players (Last 2 Weeks)", data: players, backgroundColor: "rgba(153,102,255,0.6)" },
                { label: "Review Score", data: reviews, backgroundColor: "rgba(255,159,64,0.6)" }
            ]
        }
    });
}

function renderTrends(trends) {
    const ctx = document.getElementById("trendChart").getContext("2d");
    if (trendChartInstance) trendChartInstance.destroy();

    const labels = Array.from({ length: trends[Object.keys(trends)[0]].length }, (_, i) => `Day ${i + 1}`);
    const datasets = Object.keys(trends).map((title, i) => ({
        label: title,
        data: trends[title],
        borderColor: `hsl(${i * 60}, 70%, 50%)`,
        fill: false,
        tension: 0.3
    }));

    trendChartInstance = new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: "Google Trends Interest (Past 7 Days)" }
            }
        }
    });
}

