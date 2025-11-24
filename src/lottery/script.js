window.onerror = function (msg, url, line, col, error) {
    alert("Error: " + msg + "\nLine: " + line + "\nCol: " + col);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const ballContainer = document.getElementById('ball-container');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOpen = document.getElementById('sidebar-open');
    const sidebar = document.querySelector('.sidebar');
    const dashboard = document.querySelector('.dashboard');

    // Audio Context
    let audioCtx;

    // Event Listeners
    if (startBtn) startBtn.addEventListener('click', generateNumbers);
    if (resetBtn) resetBtn.addEventListener('click', resetGame);

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');

        if (sidebar.classList.contains('collapsed')) {
            if (sidebarOpen) sidebarOpen.classList.remove('hidden');
        } else {
            if (sidebarOpen) sidebarOpen.classList.add('hidden');
        }

        // Resize chart if needed
        const chartInstance = Chart.getChart("frequencyChart");
        if (chartInstance) {
            setTimeout(() => chartInstance.resize(), 300);
        }
    }

    if (sidebarClose) sidebarClose.addEventListener('click', toggleSidebar);
    if (sidebarOpen) sidebarOpen.addEventListener('click', toggleSidebar);

    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding content
            const tabId = btn.getAttribute('data-tab');
            const content = document.getElementById(tabId);
            if (content) {
                content.classList.add('active');

                // Resize chart if switching to main view
                if (tabId === 'main-view') {
                    const chartInstance = Chart.getChart("frequencyChart");
                    if (chartInstance) {
                        setTimeout(() => chartInstance.resize(), 100);
                    }
                }
            }
        });
    });

    // Load Data
    const recentWinningNumbers = typeof allWinningNumbers !== 'undefined' ? allWinningNumbers : [];
    console.log(`Loaded ${recentWinningNumbers.length} past draws.`);

    // --- Algorithms ---

    // --- RNG Implementations ---

    async function getRNG(type) {
        switch (type) {
            case 'secure':
                return () => {
                    const array = new Uint32Array(1);
                    window.crypto.getRandomValues(array);
                    return array[0] / (0xFFFFFFFF + 1);
                };
            case 'vrf':
                // Simulated VRF: Hash(Seed + Counter)
                // In a real app, this would verify a proof from a VRF provider.
                const seed = Date.now().toString();
                let counter = 0;
                return async () => {
                    counter++;
                    const msg = seed + counter;
                    const msgBuffer = new TextEncoder().encode(msg);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    // Use first 4 bytes for randomness
                    const value = (hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3];
                    return (value >>> 0) / (0xFFFFFFFF + 1);
                };
            case 'blockchain':
                try {
                    // Fetch latest Bitcoin block hash
                    const response = await fetch('https://blockchain.info/q/latesthash?cors=true');
                    if (!response.ok) throw new Error('Blockchain API failed');
                    const hash = await response.text();
                    console.log("Using Bitcoin Block Hash:", hash);

                    // Simple seeded RNG (Mulberry32) using the hash
                    let seedVal = 0;
                    for (let i = 0; i < hash.length; i++) {
                        seedVal = ((seedVal << 5) - seedVal) + hash.charCodeAt(i);
                        seedVal |= 0;
                    }

                    return () => {
                        var t = seedVal += 0x6D2B79F5;
                        t = Math.imul(t ^ (t >>> 15), t | 1);
                        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
                    };
                } catch (e) {
                    console.warn("Blockchain RNG failed, falling back to Secure RNG:", e);
                    return getRNG('secure');
                }
            case 'prng':
            default:
                return () => Math.random();
        }
    }

    async function generateNumbers() {
        initAudio();
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.classList.add('hidden');
        }
        if (resetBtn) resetBtn.classList.add('hidden');
        if (ballContainer) ballContainer.innerHTML = '';

        const selectedAlgoInput = document.querySelector('input[name="algorithm"]:checked');
        const selectedAlgo = selectedAlgoInput ? selectedAlgoInput.value : 'random';

        const selectedRngInput = document.querySelector('input[name="rng"]:checked');
        const selectedRngType = selectedRngInput ? selectedRngInput.value : 'prng';

        console.log(`Generating numbers using Algo: ${selectedAlgo}, RNG: ${selectedRngType}`);

        let numbers = [];
        try {
            // Get RNG function (might be async for blockchain/vrf)
            const rngFunc = await getRNG(selectedRngType);

            // Wrap rngFunc if it's async (VRF) to be usable in sync contexts if needed, 
            // but mostly we'll await it. 
            // Actually, let's make helper functions accept async RNG.

            if (selectedAlgo === 'weighted') {
                numbers = await getWeightedNumbers(rngFunc);
            } else if (selectedAlgo === 'adaptive') {
                numbers = await getAdaptiveNumbers(rngFunc);
            } else if (selectedAlgo === 'non-frequency') {
                numbers = await getNonFrequencyNumbers(rngFunc);
            } else {
                numbers = await getRandomNumbers(rngFunc);
            }
        } catch (e) {
            console.error("Generation error:", e);
            numbers = await getRandomNumbers(() => Math.random()); // Fallback
        }

        // numbers.sort((a, b) => a - b); // Sort all for now? No, wait.
        // We need to separate Main (6) and Bonus (1) BEFORE sorting the main ones.
        // But getRandomNumbers returns 7 numbers. The last one is effectively the bonus?
        // In standard lotto, the bonus is usually the last drawn.
        // But my algorithms (except simulation) just pick 7 unique numbers.
        // If I sort them all, the bonus is lost.
        // I should treat the 7th number as the bonus.

        // Actually, for random/weighted/adaptive, the order matters if we consider the last one bonus.
        // Let's assume the last one generated is the bonus.

        const mainNumbers = numbers.slice(0, 6).sort((a, b) => a - b);
        const bonusNumber = numbers[6];

        console.log("Main:", mainNumbers, "Bonus:", bonusNumber);

        let delay = 0;
        const interval = 800; // Keep original slow pace

        // Display Main Numbers
        mainNumbers.forEach((num, index) => {
            setTimeout(() => {
                createBall(num);
                playPopSound();
            }, delay);
            delay += interval;
        });

        // Display Bonus Number
        setTimeout(() => {
            const plusSign = document.createElement('div');
            plusSign.className = 'plus-sign';
            plusSign.textContent = '+';
            ballContainer.appendChild(plusSign);

            // Create bonus ball manually to add class
            const bonusBall = document.createElement('div');
            bonusBall.classList.add('ball');
            bonusBall.textContent = bonusNumber;
            if (bonusNumber <= 10) bonusBall.classList.add('range-1');
            else if (bonusNumber <= 20) bonusBall.classList.add('range-2');
            else if (bonusNumber <= 30) bonusBall.classList.add('range-3');
            else if (bonusNumber <= 40) bonusBall.classList.add('range-4');
            else bonusBall.classList.add('range-5');
            bonusBall.classList.add('bonus-ball');

            ballContainer.appendChild(bonusBall);
            playPopSound();

            // Completion Logic
            if (resetBtn) resetBtn.classList.remove('hidden');
            if (startBtn) startBtn.disabled = false;

            // Add to history (pass original unsorted array or sorted main + bonus?)
            // addToHistory expects an array. It handles splitting itself.
            // But we should pass [main..., bonus] to ensure consistency.
            addToHistory([...mainNumbers, bonusNumber], selectedAlgo, selectedRngType);

        }, delay);
    }

    // --- History Management ---
    function saveHistory() {
        const historyContainer = document.getElementById('history-log');
        if (!historyContainer) return;

        const historyData = [];
        const items = historyContainer.querySelectorAll('.history-item');
        items.forEach(item => {
            const date = item.querySelector('.history-date').textContent;
            const info = item.querySelector('.history-info').textContent;
            const balls = Array.from(item.querySelectorAll('.ball')).map(b => parseInt(b.textContent));
            historyData.push({ date, info, balls });
        });

        localStorage.setItem('lottoHistory', JSON.stringify(historyData));
    }

    function loadHistory() {
        const historyContainer = document.getElementById('history-log');
        if (!historyContainer) return;

        const savedHistory = localStorage.getItem('lottoHistory');
        if (savedHistory) {
            const historyData = JSON.parse(savedHistory);
            // Clear current list to avoid duplicates if any (though usually empty on load)
            historyContainer.innerHTML = '';

            // Reverse to add oldest first so prepend works correctly (or just append)
            // Actually addToHistory prepends, so we should process saved data from last to first?
            // Let's just rebuild the DOM directly from the saved array.
            // The saved array is in order of DOM (newest first).

            historyData.forEach(data => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'history-item';

                let ballsHtml = '';
                data.balls.forEach(num => {
                    let rangeClass = '';
                    if (num <= 10) rangeClass = 'range-1';
                    else if (num <= 20) rangeClass = 'range-2';
                    else if (num <= 30) rangeClass = 'range-3';
                    else if (num <= 40) rangeClass = 'range-4';
                    else rangeClass = 'range-5';
                    ballsHtml += `<div class="ball ${rangeClass}">${num}</div>`;
                });

                itemDiv.innerHTML = `
                    <div class="history-header">
                        <span class="history-date">${data.date}</span>
                        <span class="history-info">${data.info}</span>
                    </div>
                    <div class="history-balls">
                        ${ballsHtml}
                    </div>
                `;
                historyContainer.appendChild(itemDiv); // Append because list is already sorted newest first
            });
        }
    }

    function addToHistory(numbers, algoName, rngName) {
        const historyContainer = document.getElementById('history-log');
        if (!historyContainer) return;

        // Remove placeholder if it exists
        const placeholder = historyContainer.querySelector('.history-placeholder');
        if (placeholder) placeholder.remove();

        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';

        const now = new Date();
        const dateStr = now.toLocaleString();

        // Separate Main and Bonus
        const mainNumbers = numbers.slice(0, 6).sort((a, b) => a - b);
        const bonusNumber = numbers[6];

        let ballsHtml = '';
        mainNumbers.forEach(num => {
            let rangeClass = '';
            if (num <= 10) rangeClass = 'range-1';
            else if (num <= 20) rangeClass = 'range-2';
            else if (num <= 30) rangeClass = 'range-3';
            else if (num <= 40) rangeClass = 'range-4';
            else rangeClass = 'range-5';
            ballsHtml += `<div class="ball ${rangeClass}">${num}</div>`;
        });

        // Add Plus Sign
        ballsHtml += `<div class="plus-sign-small">+</div>`;

        // Add Bonus Ball
        let bonusRangeClass = '';
        if (bonusNumber <= 10) bonusRangeClass = 'range-1';
        else if (bonusNumber <= 20) bonusRangeClass = 'range-2';
        else if (bonusNumber <= 30) bonusRangeClass = 'range-3';
        else if (bonusNumber <= 40) bonusRangeClass = 'range-4';
        else bonusRangeClass = 'range-5';
        ballsHtml += `<div class="ball ${bonusRangeClass} bonus-ball-small">${bonusNumber}</div>`;

        itemDiv.innerHTML = `
            <div class="history-header">
                <span class="history-date">${dateStr}</span>
                <span class="history-info">${algoName} | ${rngName}</span>
            </div>
            <div class="history-balls">
                ${ballsHtml}
            </div>
        `;

        if (historyContainer.firstChild) {
            historyContainer.insertBefore(itemDiv, historyContainer.firstChild);
        } else {
            historyContainer.appendChild(itemDiv);
        }

        saveHistory();
    }

    // ... (SimBall class and other functions) ...

    function animateSimulation(timestamp) {
        if (!simRunning) return;

        simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);

        drawMachine();

        // ... (Slider inputs) ...
        // Get Turbulence Value
        let turbulence = 5;
        if (turbulenceSlider) {
            turbulence = parseInt(turbulenceSlider.value);
        }

        // Get Gravity Value
        let gravity = 0.3;
        if (gravitySlider) {
            gravity = parseInt(gravitySlider.value) * 0.1;
        }

        // Get Ball Size
        let ballSize = 10;
        if (sizeSlider) {
            ballSize = parseInt(sizeSlider.value);
        }

        drawGauge(turbulence);

        // Update and Draw Physics Balls
        simBalls.forEach(ball => {
            ball.radius = ballSize;
            ball.update(turbulence, gravity);
            ball.draw();
        });

        resolveCollisions();

        // Extraction Logic (Air Suction with Interval)
        if (simSelected.length < 7) { // Changed to 7 for Bonus
            // Check Interval
            let interval = 2000; // Default 2s
            if (intervalInput) {
                interval = parseFloat(intervalInput.value) * 1000;
            }

            if (!lastExtractionTime || timestamp - lastExtractionTime >= interval) {
                // Check if any ball is near the top center suction zone
                for (let i = 0; i < simBalls.length; i++) {
                    const b = simBalls[i];
                    // Suction Zone: Top center, within radius
                    const dx = b.x - drumCenter.x;
                    const dy = b.y - (drumCenter.y - drumRadius + 20);
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < suctionRadius) {
                        // Sucked up!
                        simSelected.push(b.id);
                        simBalls.splice(i, 1);
                        lastExtractionTime = timestamp; // Update timer

                        // Display selected ball
                        if (simSelected.length === 7) {
                            // Bonus Ball Display
                            const plusSign = document.createElement('div');
                            plusSign.className = 'plus-sign';
                            plusSign.textContent = '+';
                            simResults.appendChild(plusSign);
                        }

                        const ballDiv = document.createElement('div');
                        ballDiv.classList.add('ball');
                        ballDiv.textContent = b.id;
                        if (b.id <= 10) ballDiv.classList.add('range-1');
                        else if (b.id <= 20) ballDiv.classList.add('range-2');
                        else if (b.id <= 30) ballDiv.classList.add('range-3');
                        else if (b.id <= 40) ballDiv.classList.add('range-4');
                        else ballDiv.classList.add('range-5');

                        if (simSelected.length === 7) {
                            ballDiv.classList.add('bonus-ball');
                        }

                        simResults.appendChild(ballDiv);
                        playPopSound();

                        if (simSelected.length === 7) {
                            // Sort first 6, keep 7th as bonus
                            const main = simSelected.slice(0, 6).sort((a, b) => a - b);
                            const bonus = simSelected[6];
                            const finalResult = [...main, bonus];

                            addToHistory(finalResult, 'Mechanical Sim', 'Physics');
                            simStartBtn.disabled = false;
                            simRunning = false;
                        }
                        break; // One ball at a time
                    }
                }
            }
        }

        animationId = requestAnimationFrame(animateSimulation);
    }

    // --- Algorithms (Updated for RNG) ---

    async function getRandomNumbers(rng) {
        const numbers = [];
        while (numbers.length < 7) {
            const randomVal = await rng();
            const num = Math.floor(randomVal * 45) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        return numbers;
    }

    async function getWeightedNumbers(rng) {
        const frequency = {};
        for (let i = 1; i <= 45; i++) frequency[i] = 1; // Base weight

        recentWinningNumbers.forEach(draw => {
            if (Array.isArray(draw)) {
                draw.forEach(num => {
                    if (frequency[num]) {
                        frequency[num] += 1;
                    }
                });
            }
        });

        return createPoolAndPick(frequency, 1, rng);
    }

    async function getAdaptiveNumbers(rng) {
        const weights = {};
        for (let i = 1; i <= 45; i++) weights[i] = 1.0;

        const decayRate = 0.96;
        const reward = 1.0;

        const history = [...recentWinningNumbers];

        for (let i = history.length - 1; i >= 0; i--) {
            const draw = history[i];
            if (!Array.isArray(draw)) continue;

            for (let w = 1; w <= 45; w++) {
                weights[w] *= decayRate;
            }

            draw.forEach(num => {
                if (weights[num] !== undefined) {
                    weights[num] += reward;
                }
            });
        }

        return createPoolAndPick(weights, 10, rng);
    }

    async function getNonFrequencyNumbers(rng) {
        const frequency = {};
        for (let i = 1; i <= 45; i++) frequency[i] = 0;

        recentWinningNumbers.forEach(draw => {
            if (Array.isArray(draw)) {
                draw.forEach(num => {
                    if (frequency[num] !== undefined) {
                        frequency[num]++;
                    }
                });
            }
        });

        // Invert weights: Less frequent = Higher weight
        const weights = {};
        for (let i = 1; i <= 45; i++) {
            // Add 1 to avoid division by zero and ensure base weight
            // Use inverse: 1 / (freq + 1)
            weights[i] = 100 / (frequency[i] + 1);
        }

        return createPoolAndPick(weights, 1, rng);
    }

    // --- Helper Functions ---

    async function createPoolAndPick(weights, power, rng) {
        const pool = [];
        for (const [num, weight] of Object.entries(weights)) {
            const count = Math.round(Math.pow(weight, power) * 10);
            for (let k = 0; k < count; k++) {
                pool.push(parseInt(num));
            }
        }

        const result = [];
        while (result.length < 7) {
            const randomVal = await rng();
            const index = Math.floor(randomVal * pool.length);
            const num = pool[index];
            if (!result.includes(num)) {
                result.push(num);
            }
        }
        return result;
    }

    // --- Display Logic ---

    function displayNumbers(numbers) {
        const container = document.getElementById('ball-container');
        if (!container) return;
        container.innerHTML = '';

        // Separate Main (6) and Bonus (1)
        const mainNumbers = numbers.slice(0, 6).sort((a, b) => a - b);
        const bonusNumber = numbers[6];

        mainNumbers.forEach((num, index) => {
            setTimeout(() => {
                const ball = createBallElement(num);
                container.appendChild(ball);
                playPopSound();
            }, index * 200);
        });

        // Display Bonus Number
        setTimeout(() => {
            const plusSign = document.createElement('div');
            plusSign.className = 'plus-sign';
            plusSign.textContent = '+';
            container.appendChild(plusSign);

            const bonusBall = createBallElement(bonusNumber);
            bonusBall.classList.add('bonus-ball');
            container.appendChild(bonusBall);
            playPopSound();
        }, 6 * 200);
    }

    function createBallElement(num) {
        const ball = document.createElement('div');
        ball.classList.add('ball');
        if (num <= 10) ball.classList.add('range-1');
        else if (num <= 20) ball.classList.add('range-2');
        else if (num <= 30) ball.classList.add('range-3');
        else if (num <= 40) ball.classList.add('range-4');
        else ball.classList.add('range-5');
        ball.textContent = num;
        return ball;
    }

    function initAudio() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        } catch (e) {
            console.warn("AudioContext not supported or failed:", e);
        }
    }

    function playPopSound() {
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.warn("Audio play failed:", e);
        }
    }

    function createBall(number) {
        if (!ballContainer) return;
        const ball = document.createElement('div');
        ball.classList.add('ball');
        ball.textContent = number;

        if (number <= 10) ball.classList.add('range-1');
        else if (number <= 20) ball.classList.add('range-2');
        else if (number <= 30) ball.classList.add('range-3');
        else if (number <= 40) ball.classList.add('range-4');
        else ball.classList.add('range-5');

        ballContainer.appendChild(ball);
    }

    function resetGame() {
        if (ballContainer) ballContainer.innerHTML = '';
        if (startBtn) {
            startBtn.classList.remove('hidden');
            startBtn.disabled = false;
        }
        if (resetBtn) resetBtn.classList.add('hidden');
    }

    // --- Chart ---
    function renderChart() {
        const ctx = document.getElementById('frequencyChart');
        if (!ctx) return;

        // Load Bonus Numbers
        const recentBonusNumbers = typeof allBonusNumbers !== 'undefined' ? allBonusNumbers : [];

        // Calculate frequency
        const frequency = Array(46).fill(0); // Index 0 unused
        const bonusFrequency = Array(46).fill(0);

        recentWinningNumbers.forEach(draw => {
            if (Array.isArray(draw)) {
                draw.forEach(num => {
                    if (num >= 1 && num <= 45) {
                        frequency[num]++;
                    }
                });
            }
        });

        recentBonusNumbers.forEach(num => {
            if (num >= 1 && num <= 45) {
                bonusFrequency[num]++;
            }
        });

        // Prepare data for Chart.js
        const labels = [];
        const data = [];
        const bonusData = [];
        const backgroundColors = [];
        const borderColors = [];

        for (let i = 1; i <= 45; i++) {
            labels.push(i);
            data.push(frequency[i]);
            bonusData.push(bonusFrequency[i]);

            // Color based on range
            if (i <= 10) {
                backgroundColors.push('rgba(251, 197, 49, 0.6)'); // Yellow
                borderColors.push('rgba(251, 197, 49, 1)');
            } else if (i <= 20) {
                backgroundColors.push('rgba(9, 132, 227, 0.6)'); // Blue
                borderColors.push('rgba(9, 132, 227, 1)');
            } else if (i <= 30) {
                backgroundColors.push('rgba(232, 65, 24, 0.6)'); // Red
                borderColors.push('rgba(232, 65, 24, 1)');
            } else if (i <= 40) {
                backgroundColors.push('rgba(127, 143, 166, 0.6)'); // Grey
                borderColors.push('rgba(127, 143, 166, 1)');
            } else {
                backgroundColors.push('rgba(76, 209, 55, 0.6)'); // Green
                borderColors.push('rgba(76, 209, 55, 1)');
            }
        }

        new Chart(ctx, {
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Main Numbers',
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1,
                        order: 2,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Bonus Numbers',
                        data: bonusData,
                        backgroundColor: 'rgba(45, 52, 54, 0.2)',
                        borderColor: 'rgba(45, 52, 54, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(45, 52, 54, 1)',
                        pointRadius: 3,
                        tension: 0.4, // Smooth curve
                        order: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Main Frequency'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                        },
                        title: {
                            display: true,
                            text: 'Bonus Frequency'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Number'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Winning Number Frequency (Main vs Bonus)'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    // --- Mechanical Simulation ---
    const simCanvas = document.getElementById('simCanvas');
    const simStartBtn = document.getElementById('sim-start-btn');
    const simResults = document.getElementById('sim-results');
    const turbulenceSlider = document.getElementById('turbulence-slider');
    const intervalInput = document.getElementById('interval-input');
    const gravitySlider = document.getElementById('gravity-slider');
    const sizeSlider = document.getElementById('size-slider');
    let simCtx;
    let simRunning = false;
    let simBalls = [];
    let simSelected = []; // Stores IDs of selected balls
    let animationId;
    let lastExtractionTime = 0;

    // Machine Properties
    let drumCenter = { x: 300, y: 200 };
    let drumRadius = 180;

    // Air Suction Properties
    let suctionRadius = 30; // Radius of the suction zone at top center

    if (simCanvas) {
        simCtx = simCanvas.getContext('2d');
        simCanvas.width = 600;
        simCanvas.height = 400;
        drumCenter = { x: simCanvas.width / 2, y: simCanvas.height / 2 };
    }

    class SimBall {
        constructor(id) {
            this.id = id;
            this.radius = 10;
            // Initial position: Random inside circle
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * (drumRadius - 20);
            this.x = drumCenter.x + Math.cos(angle) * r;
            this.y = drumCenter.y + Math.sin(angle) * r;

            this.vx = (Math.random() - 0.5) * 15;
            this.vy = (Math.random() - 0.5) * 15;

            this.mass = 1 + (Math.random() - 0.5) * 0.05;
            this.elasticity = 0.85;
            this.friction = 0.99;

            // Color
            if (id <= 10) this.color = '#fbc531';
            else if (id <= 20) this.color = '#0984e3';
            else if (id <= 30) this.color = '#e84118';
            else if (id <= 40) this.color = '#7f8fa6';
            else this.color = '#4cd137';
        }

        draw() {
            simCtx.beginPath();
            simCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

            // 3D Gradient
            const gradient = simCtx.createRadialGradient(
                this.x - this.radius / 3, this.y - this.radius / 3, this.radius / 10,
                this.x, this.y, this.radius
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.3, this.color);
            gradient.addColorStop(1, '#000'); // Shadow

            simCtx.fillStyle = gradient;
            simCtx.fill();

            // Number
            simCtx.fillStyle = 'white';
            simCtx.font = 'bold 10px Arial';
            simCtx.textAlign = 'center';
            simCtx.textBaseline = 'middle';
            simCtx.fillText(this.id, this.x, this.y);
            simCtx.closePath();
        }

        update(turbulenceVal, gravityVal) {
            // Gravity (Always active)
            const g = gravityVal !== undefined ? gravityVal : 0.3;
            this.vy += g;

            // Air Jet Logic (Localized at Bottom Center)
            if (turbulenceVal > 0) {
                // Jet Zone: Narrow column at the bottom
                const jetWidth = 60; // Width of the air stream
                const jetHeight = 100; // Height of the strong blast from bottom

                // Check if ball is in the horizontal range of the jet
                if (Math.abs(this.x - drumCenter.x) < jetWidth / 2) {
                    // Check if ball is near the bottom (in the blast zone)
                    if (this.y > drumCenter.y + drumRadius - jetHeight) {
                        // Apply strong upward force (Jet Blast)
                        const lift = turbulenceVal * 0.8; // Stronger lift
                        this.vy -= lift + Math.random() * 2; // Blast + chaos

                        // Slight horizontal jitter to prevent stacking
                        this.vx += (Math.random() - 0.5) * 2;
                    }
                    // If ball is higher up in the center, apply weaker residual lift + dispersion
                    else if (this.y > drumCenter.y) {
                        this.vy -= turbulenceVal * 0.1; // Weak lift
                        // Push away from center to cycle back down
                        this.vx += (Math.random() - 0.5) * 5;
                    }
                }
            }

            // Friction
            this.vx *= this.friction;
            this.vy *= this.friction;

            // Position update
            this.x += this.vx;
            this.y += this.vy;

            // Circular Wall Collision
            const dx = this.x - drumCenter.x;
            const dy = this.y - drumCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist + this.radius > drumRadius) {
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = dist + this.radius - drumRadius;
                this.x -= nx * overlap;
                this.y -= ny * overlap;

                const dot = this.vx * nx + this.vy * ny;
                this.vx = (this.vx - 2 * dot * nx) * this.elasticity;
                this.vy = (this.vy - 2 * dot * ny) * this.elasticity;

                const tx = -ny;
                const ty = nx;
                const tDot = this.vx * tx + this.vy * ty;
                this.vx -= tx * tDot * 0.05;
                this.vy -= ty * tDot * 0.05;
            }
        }
    }

    function initSimulation() {
        simBalls = [];
        simSelected = [];
        lastExtractionTime = 0; // Reset timer
        if (simResults) simResults.innerHTML = '';

        for (let i = 1; i <= 45; i++) {
            simBalls.push(new SimBall(i));
        }
    }

    function resolveCollisions() {
        for (let i = 0; i < simBalls.length; i++) {
            for (let j = i + 1; j < simBalls.length; j++) {
                const b1 = simBalls[i];
                const b2 = simBalls[j];

                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < b1.radius + b2.radius) {
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    const vx1 = b1.vx * cos + b1.vy * sin;
                    const vy1 = b1.vy * cos - b1.vx * sin;
                    const vx2 = b2.vx * cos + b2.vy * sin;
                    const vy2 = b2.vy * cos - b2.vx * sin;

                    const vx1Final = ((b1.mass - b2.mass) * vx1 + 2 * b2.mass * vx2) / (b1.mass + b2.mass);
                    const vx2Final = ((b2.mass - b1.mass) * vx2 + 2 * b1.mass * vx1) / (b1.mass + b2.mass);

                    b1.vx = vx1Final * cos - vy1 * sin;
                    b1.vy = vy1 * cos + vx1Final * sin;
                    b2.vx = vx2Final * cos - vy2 * sin;
                    b2.vy = vy2 * cos + vx2Final * sin;

                    const overlap = (b1.radius + b2.radius - distance) / 2;
                    b1.x -= overlap * cos;
                    b1.y -= overlap * sin;
                    b2.x += overlap * cos;
                    b2.y += overlap * sin;
                }
            }
        }
    }

    function drawMachine() {
        // Support Stand (Legs)
        simCtx.fillStyle = '#dfe6e9';
        simCtx.fillRect(drumCenter.x - 100, drumCenter.y + drumRadius, 20, 150);
        simCtx.fillRect(drumCenter.x + 80, drumCenter.y + drumRadius, 20, 150);
        simCtx.fillStyle = '#b2bec3';
        simCtx.fillRect(drumCenter.x - 90, drumCenter.y + drumRadius, 5, 150); // Shading
        simCtx.fillRect(drumCenter.x + 90, drumCenter.y + drumRadius, 5, 150); // Shading

        // Top Funnel (White Structure)
        simCtx.beginPath();
        simCtx.moveTo(drumCenter.x - 40, drumCenter.y - drumRadius - 60);
        simCtx.lineTo(drumCenter.x + 40, drumCenter.y - drumRadius - 60);
        simCtx.lineTo(drumCenter.x + 20, drumCenter.y - drumRadius + 10);
        simCtx.lineTo(drumCenter.x - 20, drumCenter.y - drumRadius + 10);
        simCtx.fillStyle = '#f1f2f6';
        simCtx.fill();
        simCtx.strokeStyle = '#b2bec3';
        simCtx.lineWidth = 2;
        simCtx.stroke();

        // Wide Outer Ring (Clear Disk)
        simCtx.beginPath();
        simCtx.arc(drumCenter.x, drumCenter.y, drumRadius + 40, 0, Math.PI * 2);
        simCtx.arc(drumCenter.x, drumCenter.y, drumRadius, 0, Math.PI * 2, true);
        simCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        simCtx.fill();
        simCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        simCtx.lineWidth = 1;
        simCtx.stroke();

        // Bolts on Wide Ring
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const bx = drumCenter.x + Math.cos(angle) * (drumRadius + 35);
            const by = drumCenter.y + Math.sin(angle) * (drumRadius + 35);
            simCtx.beginPath();
            simCtx.arc(bx, by, 4, 0, Math.PI * 2);
            simCtx.fillStyle = '#b2bec3';
            simCtx.fill();
            simCtx.strokeStyle = '#636e72';
            simCtx.lineWidth = 1;
            simCtx.stroke();
        }

        // Draw Drum Glass Background
        simCtx.beginPath();
        simCtx.arc(drumCenter.x, drumCenter.y, drumRadius, 0, Math.PI * 2);
        simCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        simCtx.fill();

        // Shine/Reflection (Enhanced)
        simCtx.beginPath();
        simCtx.arc(drumCenter.x - 50, drumCenter.y - 50, drumRadius * 0.8, Math.PI, 1.5 * Math.PI);
        simCtx.lineWidth = 8;
        simCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        simCtx.stroke();

        simCtx.beginPath();
        simCtx.arc(drumCenter.x + 60, drumCenter.y + 60, drumRadius * 0.7, 0, 0.5 * Math.PI);
        simCtx.lineWidth = 5;
        simCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        simCtx.stroke();

        // Central Column (Hub)
        simCtx.beginPath();
        simCtx.arc(drumCenter.x, drumCenter.y, 30, 0, Math.PI * 2);
        const hubGrad = simCtx.createRadialGradient(drumCenter.x, drumCenter.y, 5, drumCenter.x, drumCenter.y, 30);
        hubGrad.addColorStop(0, '#b2bec3');
        hubGrad.addColorStop(1, '#636e72');
        simCtx.fillStyle = hubGrad;
        simCtx.fill();
        simCtx.strokeStyle = '#2d3436';
        simCtx.lineWidth = 2;
        simCtx.stroke();

        // Suction Zone (Top Center)
        simCtx.beginPath();
        simCtx.arc(drumCenter.x, drumCenter.y - drumRadius + 20, suctionRadius, 0, Math.PI * 2);
        simCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        simCtx.fill();
        simCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        simCtx.lineWidth = 2;
        simCtx.stroke();

        // Output Tray (Zigzag)
        simCtx.beginPath();
        simCtx.moveTo(drumCenter.x, drumCenter.y + drumRadius + 20);
        simCtx.lineTo(drumCenter.x + 150, drumCenter.y + drumRadius + 40);
        simCtx.lineTo(drumCenter.x + 20, drumCenter.y + drumRadius + 80);
        simCtx.lineWidth = 15;
        simCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        simCtx.lineCap = 'round';
        simCtx.lineJoin = 'round';
        simCtx.stroke();
    }

    function drawGauge(value) {
        const x = 60;
        const y = 340;
        const r = 40;

        // Gauge Background
        simCtx.beginPath();
        simCtx.arc(x, y, r, 0.8 * Math.PI, 2.2 * Math.PI);
        simCtx.lineWidth = 5;
        simCtx.strokeStyle = '#b2bec3';
        simCtx.stroke();

        // Gauge Arc (Active)
        const maxVal = 20;
        const percent = value / maxVal;
        const startAngle = 0.8 * Math.PI;
        const endAngle = 2.2 * Math.PI;
        const currentAngle = startAngle + (endAngle - startAngle) * percent;

        simCtx.beginPath();
        simCtx.arc(x, y, r, startAngle, currentAngle);
        simCtx.lineWidth = 5;
        simCtx.strokeStyle = percent > 0.7 ? '#e17055' : '#0984e3'; // Red if high
        simCtx.stroke();

        // Needle
        simCtx.beginPath();
        simCtx.moveTo(x, y);
        simCtx.lineTo(x + Math.cos(currentAngle) * (r - 5), y + Math.sin(currentAngle) * (r - 5));
        simCtx.lineWidth = 2;
        simCtx.strokeStyle = '#d63031';
        simCtx.stroke();

        // Center Dot
        simCtx.beginPath();
        simCtx.arc(x, y, 3, 0, Math.PI * 2);
        simCtx.fillStyle = '#2d3436';
        simCtx.fill();

        // Label
        simCtx.fillStyle = '#dfe6e9';
        simCtx.font = '10px Arial';
        simCtx.textAlign = 'center';
        simCtx.fillText("AIR PRESSURE", x, y + 20);
    }

    function animateSimulation(timestamp) {
        if (!simRunning) return;

        simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);

        drawMachine();

        // Get Turbulence Value
        let turbulence = 5;
        if (turbulenceSlider) {
            turbulence = parseInt(turbulenceSlider.value);
        }

        // Get Gravity Value
        let gravity = 0.3;
        if (gravitySlider) {
            gravity = parseInt(gravitySlider.value) * 0.1;
        }

        // Get Ball Size
        let ballSize = 10;
        if (sizeSlider) {
            ballSize = parseInt(sizeSlider.value);
        }

        drawGauge(turbulence);

        // Update and Draw Physics Balls
        simBalls.forEach(ball => {
            ball.radius = ballSize;
            ball.update(turbulence, gravity);
            ball.draw();
        });

        resolveCollisions();

        // Extraction Logic (Air Suction with Interval)
        if (simSelected.length < 7) { // Changed to 7 for Bonus
            // Check Interval
            let interval = 2000; // Default 2s
            if (intervalInput) {
                interval = parseFloat(intervalInput.value) * 1000;
            }

            if (!lastExtractionTime || timestamp - lastExtractionTime >= interval) {
                // Check if any ball is near the top center suction zone
                for (let i = 0; i < simBalls.length; i++) {
                    const b = simBalls[i];
                    // Suction Zone: Top center, within radius
                    const dx = b.x - drumCenter.x;
                    const dy = b.y - (drumCenter.y - drumRadius + 20);
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < suctionRadius) {
                        // Sucked up!
                        simSelected.push(b.id);
                        simBalls.splice(i, 1);
                        lastExtractionTime = timestamp; // Update timer

                        // Display selected ball
                        if (simSelected.length === 7) {
                            // Bonus Ball Display
                            const plusSign = document.createElement('div');
                            plusSign.className = 'plus-sign';
                            plusSign.textContent = '+';
                            simResults.appendChild(plusSign);
                        }

                        const ballDiv = document.createElement('div');
                        ballDiv.classList.add('ball');
                        ballDiv.textContent = b.id;
                        if (b.id <= 10) ballDiv.classList.add('range-1');
                        else if (b.id <= 20) ballDiv.classList.add('range-2');
                        else if (b.id <= 30) ballDiv.classList.add('range-3');
                        else if (b.id <= 40) ballDiv.classList.add('range-4');
                        else ballDiv.classList.add('range-5');

                        if (simSelected.length === 7) {
                            ballDiv.classList.add('bonus-ball');
                        }

                        simResults.appendChild(ballDiv);
                        playPopSound();

                        if (simSelected.length === 7) {
                            // Sort first 6, keep 7th as bonus
                            const main = simSelected.slice(0, 6).sort((a, b) => a - b);
                            const bonus = simSelected[6];
                            const finalResult = [...main, bonus];

                            addToHistory(finalResult, 'Mechanical Sim', 'Physics');
                            simStartBtn.disabled = false;
                            simRunning = false;
                        }
                        break; // One ball at a time
                    }
                }
            }
        }

        animationId = requestAnimationFrame(animateSimulation);
    }

    if (simStartBtn) {
        simStartBtn.addEventListener('click', () => {
            if (simRunning) return;
            simRunning = true;
            simStartBtn.disabled = true;
            initSimulation();
            requestAnimationFrame(animateSimulation); // Start loop with timestamp
        });
    }

    // Initial Render
    renderChart();
});
