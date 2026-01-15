let chartInstance = null;
let trendChartInstance = null;
let playersChartInstance = null;
let allGamesData = [];

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    body.classList.toggle('light-theme');
    
    // Save theme preference
    const isDarkTheme = !body.classList.contains('light-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    
    // Update button emoji
    themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
}

// Initialize theme on page load
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeToggle.textContent = '🌙';
    } else {
        body.classList.remove('light-theme');
        themeToggle.textContent = '☀️';
    }
}

// Initialize theme when page loads
document.addEventListener('DOMContentLoaded', initTheme);

function fetchGameStats() {
    const input = document.getElementById("appIdInput").value.trim();
    const loadingMsg = document.getElementById("loadingMessage");
    const gameInfoContainer = document.getElementById("gameInfoContainer");
    gameInfoContainer.innerHTML = "";
    
    if (!input) return alert("Enter some game names");

    loadingMsg.style.display = "block";

    fetch(`http://localhost:5000/game_stats?names=${encodeURIComponent(input)}`)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(({ games, trends }) => {
        loadingMsg.style.display = "none";
        allGamesData = games;

        const labels = games.map(g => g.Title);
        const owners = games.map(g => parseOwnerRange(g.Owners));
        const players = games.map(g => g.Players_2Weeks);
        const reviews = games.map(g => g.ReviewScore);

        // Create tabs
        createTabs(games);

        // Render charts
        renderChart(labels, owners, players, reviews);
        renderTrends(trends);
        renderPlayersChart(labels, players);

        // Render game info cards
        games.forEach((game, index) => {
            const card = document.createElement("div");
            card.className = "game-card";
            card.innerHTML = `
                <h3>game info: ${game.Title}</h3>
                <p><strong>genres:</strong> ${game.Genres.join(', ')}</p>
                <p><strong>top tags:</strong> ${game.Tags.join(', ')}</p>
            `;
            gameInfoContainer.appendChild(card);
        });
    })
    .catch(error => {
        loadingMsg.style.display = "none";
        console.error('Fetch error:', error);
        alert(`Error fetching game stats: ${error.message}. Ensure the Flask server is running on http://localhost:5000.`);
    });
}

function createTabs(games) {
    const tabsContainer = document.getElementById("dashboardTabs");
    tabsContainer.innerHTML = "";

    games.forEach((game, index) => {
        const tab = document.createElement("button");
        tab.className = `tab-button ${index === 0 ? 'active' : ''}`;
        tab.textContent = game.Title;
        tab.onclick = () => selectTab(index);
        tabsContainer.appendChild(tab);
    });
}

function selectTab(index) {
    const tabs = document.querySelectorAll(".tab-button");
    tabs.forEach(tab => tab.classList.remove("active"));
    tabs[index].classList.add("active");
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
                { label: "Estimated Owners", data: owners, backgroundColor: "rgba(75,192,192,0.8)" },
                { label: "Players (Last 2 Weeks)", data: players, backgroundColor: "rgba(153,102,255,0.8)" },
                { label: "Review Score", data: reviews, backgroundColor: "rgba(255,159,64,0.8)" }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 12
            },
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderPlayersChart(labels, players) {
    const ctx = document.getElementById("playersChart").getContext("2d");
    if (playersChartInstance) playersChartInstance.destroy();

    playersChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Players (Last 2 Weeks)",
                data: players,
                borderColor: "rgba(75,192,192,1)",
                backgroundColor: "rgba(75,192,192,0.2)",
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 12
            },
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderTrends(trends) {
    const ctx = document.getElementById("trendChart").getContext("2d");
    if (trendChartInstance) trendChartInstance.destroy();

    const trendKeys = Object.keys(trends);
    if (trendKeys.length === 0 || !trends[trendKeys[0]] || trends[trendKeys[0]].length === 0) {
        return;
    }

    const labels = Array.from({ length: trends[trendKeys[0]].length }, (_, i) => `Day ${i + 1}`);
    const datasets = trendKeys.map((title, i) => ({
        label: title,
        data: trends[title],
        borderColor: `hsl(${i * 60}, 70%, 50%)`,
        backgroundColor: `hsla(${i * 60}, 70%, 50%, 0.1)`,
        fill: false,
        tension: 0.3,
        borderWidth: 2
    }));

    trendChartInstance = new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 12
            },
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
