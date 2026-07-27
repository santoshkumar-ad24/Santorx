document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    // Elements
    const startScreen = document.getElementById('game-start-screen');
    const playScreen = document.getElementById('game-play-screen');
    const endScreen = document.getElementById('game-end-screen');
    const gameGrid = document.getElementById('gameGrid');
    
    const timerDisplay = document.getElementById('timerDisplay');
    const errorDisplay = document.getElementById('errorDisplay');
    const finalScoreDisplay = document.getElementById('finalScore');
    const finalTimeDisplay = document.getElementById('finalTime');
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    const startLeaderboardContainer = document.getElementById('startLeaderboardContainer');
    const gameStatusTag = document.getElementById('gameStatusTag');

    const startGameBtn = document.getElementById('startGameBtn');
    const restartGameBtn = document.getElementById('restartGameBtn');

    // Game State
    let currentNumber = 1;
    let errors = 0;
    let startTime;
    let timerInterval;
    let isMemorizing = false;
    let isPlaying = false;
    let timeTaken = 0;
    let sequenceTimeouts = [];

    // Initialization
    generateBlankGrid();
    fetchLeaderboard();
    startGameBtn.addEventListener('click', startGame);
    restartGameBtn.addEventListener('click', startGame);

    async function fetchLeaderboard() {
        try {
            const boardRes = await fetch('/game/leaderboard');
            const boardData = await boardRes.json();
            if (boardData.success) {
                renderLeaderboard(boardData, startLeaderboardContainer, false);
            } else {
                if(startLeaderboardContainer) startLeaderboardContainer.innerHTML = '<p class="error-text">Failed to load leaderboard.</p>';
            }
        } catch (error) {
            console.error("Error fetching initial leaderboard:", error);
            if(startLeaderboardContainer) startLeaderboardContainer.innerHTML = '<p class="error-text">Connection error.</p>';
        }
    }

    function generateBlankGrid() {
        gameGrid.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell hidden';
            gameGrid.appendChild(cell);
        }
    }

    function startGame() {
        // Clear any ongoing memorization timeouts
        sequenceTimeouts.forEach(t => clearTimeout(t));
        sequenceTimeouts = [];

        // Reset state
        currentNumber = 1;
        errors = 0;
        timeTaken = 0;
        timerDisplay.textContent = '0.0';
        errorDisplay.textContent = '0';
        gameStatusTag.textContent = 'MEMORIZE';
        gameStatusTag.style.background = 'rgba(255, 153, 0, 0.2)';
        gameStatusTag.style.color = '#cc7a00';

        // Hide overlays
        startScreen.classList.remove('active');
        endScreen.classList.remove('active');

        generateGrid();
        startMemorizationPhase();
    }

    function generateGrid() {
        gameGrid.innerHTML = '';
        const numbers = Array.from({ length: 16 }, (_, i) => i + 1);
        // Shuffle array
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }

        numbers.forEach(num => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell visible';
            cell.dataset.number = num;
            cell.textContent = num;
            cell.addEventListener('click', handleCellClick);
            gameGrid.appendChild(cell);
        });
    }

    function startMemorizationPhase() {
        isMemorizing = true;
        isPlaying = false;
        
        const totalDuration = 17000;
        const interval = totalDuration / 16;

        // Sequentially grow cells over 11s
        for (let i = 1; i <= 16; i++) {
            const t = setTimeout(() => {
                if (!isMemorizing) return;
                const cell = document.querySelector(`.grid-cell[data-number="${i}"]`);
                if (cell) {
                    cell.classList.add('grow-effect');
                }
            }, (i - 1) * interval);
            sequenceTimeouts.push(t);
        }

        // Let user memorize for 11 seconds
        const mainTimeout = setTimeout(() => {
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                cell.classList.remove('visible', 'grow-effect');
                cell.classList.add('hidden');
            });
            isMemorizing = false;
            startPlayingPhase();
        }, 17000);
        sequenceTimeouts.push(mainTimeout);
    }

    function startPlayingPhase() {
        isPlaying = true;
        gameStatusTag.textContent = 'PLAYING';
        gameStatusTag.style.background = 'rgba(0, 101, 98, 0.1)';
        gameStatusTag.style.color = 'var(--teal)';
        startTime = Date.now();
        
        timerInterval = setInterval(() => {
            const now = Date.now();
            timeTaken = (now - startTime) / 1000;
            timerDisplay.textContent = timeTaken.toFixed(1);

            // Time limit of 150 seconds
            if (timeTaken >= 150) {
                timeTaken = 150;
                timerDisplay.textContent = '150.0';
                endGame(true); // pass true for time out
            }
        }, 100);
    }

    function handleCellClick(e) {
        if (!isPlaying || isMemorizing) return;
        
        const cell = e.target;
        if (cell.classList.contains('correct')) return; // Already clicked correctly

        const clickedNum = parseInt(cell.dataset.number);

        if (clickedNum === currentNumber) {
            // Correct click
            cell.classList.remove('hidden');
            cell.classList.add('correct');
            currentNumber++;

            if (currentNumber > 16) {
                endGame();
            }
        } else {
            // Incorrect click
            errors++;
            errorDisplay.textContent = errors;
            cell.classList.add('shake', 'error');
            setTimeout(() => {
                cell.classList.remove('shake', 'error');
            }, 500);
        }
    }

    async function endGame(isTimeOut = false) {
        isPlaying = false;
        clearInterval(timerInterval);
        gameStatusTag.textContent = isTimeOut ? 'TIME OUT' : 'GAME OVER';
        gameStatusTag.style.background = 'rgba(255, 0, 0, 0.1)';
        gameStatusTag.style.color = '#cc0000';

        // If timed out, score is 0. Otherwise calculate normally.
        let score = 0;
        if (!isTimeOut) {
            score = Math.floor((16 * 100) - (errors * 20));
            if (score < 0) score = 0;
        }

        finalScoreDisplay.textContent = score;
        finalTimeDisplay.textContent = timeTaken.toFixed(1);

        // Show end overlay
        endScreen.classList.add('active');
        leaderboardContainer.innerHTML = '<p class="loading-text">Saving score...</p>';

        try {
            // Submit score
            const scoreRes = await fetch('/game/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    correctClicks: 16,
                    incorrectClicks: errors,
                    timeTaken: timeTaken
                })
            });
            const scoreData = await scoreRes.json();
            
            if (scoreData.success) {
                finalScoreDisplay.textContent = scoreData.score;
            }

            // Fetch leaderboard and blogs
            leaderboardContainer.innerHTML = '<p class="loading-text">Loading Leaderboard...</p>';
            const boardRes = await fetch('/game/leaderboard');
            const boardData = await boardRes.json();

            if (boardData.success) {
                renderLeaderboard(boardData, leaderboardContainer, true);
            } else {
                leaderboardContainer.innerHTML = '<p class="error-text">Failed to load leaderboard.</p>';
            }

        } catch (error) {
            console.error("Game submission error:", error);
            leaderboardContainer.innerHTML = '<p class="error-text">Connection error.</p>';
        }
    }

    function renderLeaderboard(data, containerElement, showBlogs = true) {
        if (!containerElement) return;
        let html = '';
        
        // Leaderboard Section
        html += '<div class="leaderboard-section"><h4>🏆 Top Players</h4><ul class="leaderboard-list">';
        data.leaderboard.forEach((entry, index) => {
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            
            html += `
                <li class="leaderboard-item">
                    <span class="rank">${medal} ${entry.playerName}</span>
                    <span class="score-val">${entry.score} pts (${entry.timeTaken.toFixed(1)}s)</span>
                </li>
            `;
        });
        html += '</ul></div>';

        if (data.userBestScore) {
            html += `<div class="user-best-section">
                <p>Your Best: <strong>${data.userBestScore.score} pts</strong> (${data.userBestScore.timeTaken.toFixed(1)}s)</p>
            </div>`;
        }

        // Featured Blogs Section
        if (showBlogs && data.featuredBlogs && data.featuredBlogs.length > 0) {
            html += '<div class="game-featured-blogs"><h4>📖 Read Next</h4><div class="featured-blogs-grid">';
            data.featuredBlogs.forEach(blog => {
                html += `
                    <a href="/blog/${blog.slug}" class="game-blog-card">
                        <span class="blog-tag">${blog.type}</span>
                        <div class="game-blog-img">
                            <img src="${blog.imageUrl}" alt="blog image">
                        </div>
                        <h5>${blog.title}</h5>
                    </a>
                `;
            });
            html += '</div></div>';
        }

        containerElement.innerHTML = html;
    }
});
