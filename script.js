let chartInstance = null;
let trendChartInstance = null;

function fetchGameStats() {
    const input = document.getElementById("appIdInput").value.trim();
    const loadingMsg = document.getElementById("loadingMessage");
    const tagsOutput = document.getElementById("tagsOutput");
    tagsOutput.innerHTML = "";
    
    if (!input) return alert("Enter some App IDs");

    loadingMsg.style.display = "block";

    fetch(`http://localhost:5000/game_stats?names=${encodeURIComponent(input)}`)
        .then(res => res.json())
        .then(({ games, trends }) => {
            loadingMsg.style.display = "none";

            const labels = games.map(g => g.Title);
            const owners = games.map(g => parseOwnerRange(g.Owners));
            const players = games.map(g => g.Players_2Weeks);
            const reviews = games.map(g => g.ReviewScore);

            renderChart(labels, owners, players, reviews);
            renderTrends(trends);

            games.forEach(game => {
                tagsOutput.innerHTML += `
                    <div class="game-card">
                        <h3>${game.Title}</h3>
                        <p><strong>Genres:</strong> ${game.Genres.join(', ')}</p>
                        <p><strong>Top Tags:</strong> ${game.Tags.join(', ')}</p>
                    </div>
                `;
            });
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
