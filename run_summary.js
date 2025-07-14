// Data tracking for the run summary
let runData = {
    damageSources: {},
    upgradeTimeline: [],
    enemiesKilled: {},
    totalDamage: 0,
};

function resetRunData() {
    runData = {
        damageSources: {},
        upgradeTimeline: [],
        enemiesKilled: {},
        totalDamage: 0,
    };
}

function trackDamage(source, amount) {
    if (!runData.damageSources[source]) {
        runData.damageSources[source] = 0;
    }
    runData.damageSources[source] += amount;
    runData.totalDamage += amount;
}

function trackUpgrade(upgradeName, gameTime) {
    runData.upgradeTimeline.push({
        name: upgradeName,
        time: formatTime(gameTime),
    });
}

function trackKill(enemyType) {
    if (!runData.enemiesKilled[enemyType]) {
        runData.enemiesKilled[enemyType] = 0;
    }
    runData.enemiesKilled[enemyType]++;
}

function drawRunSummary() {
    const summaryContainer = document.getElementById('run-summary-container');
    summaryContainer.style.display = 'block';
    summaryContainer.innerHTML = `
        <div class="run-summary-content">
            <h2>Run Summary</h2>
            <div class="summary-section">
                <h3>Damage Sources</h3>
                <canvas id="damage-chart" width="400" height="200"></canvas>
            </div>
            <div class="summary-section">
                <h3>Upgrade Timeline</h3>
                <ul id="upgrade-list"></ul>
            </div>
            <div class="summary-section">
                <h3>Enemies Killed</h3>
                <ul id="enemy-list"></ul>
            </div>
            <button onclick="hideRunSummary()">Close</button>
        </div>
    `;

    // Populate upgrade timeline
    const upgradeList = document.getElementById('upgrade-list');
    runData.upgradeTimeline.forEach(upgrade => {
        const li = document.createElement('li');
        li.textContent = `${upgrade.name} at ${upgrade.time}`;
        upgradeList.appendChild(li);
    });

    // Populate enemy kill list
    const enemyList = document.getElementById('enemy-list');
    for (const enemy in runData.enemiesKilled) {
        const li = document.createElement('li');
        li.textContent = `${enemy}: ${runData.enemiesKilled[enemy]}`;
        enemyList.appendChild(li);
    }

    // Create damage chart
    const ctx = document.getElementById('damage-chart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(runData.damageSources),
            datasets: [{
                data: Object.values(runData.damageSources),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Damage Sources'
                }
            }
        }
    });
}

function hideRunSummary() {
    const summaryContainer = document.getElementById('run-summary-container');
    summaryContainer.style.display = 'none';
    gameState = 'gameover';
}
