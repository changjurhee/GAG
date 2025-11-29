/**
 * Main entry point for the Lottery Generator
 */

// Error handling - use console.error instead of alert for production
window.onerror = function (msg, url, line, col, error) {
    console.error("Error:", msg, "\nLine:", line, "\nCol:", col, "\nError:", error);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const ballContainer = document.getElementById('ball-container');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOpen = document.getElementById('sidebar-open');
    const sidebar = document.querySelector('.sidebar');

    // Load Data
    const recentWinningNumbers = typeof allWinningNumbers !== 'undefined' ? allWinningNumbers : [];
    const recentBonusNumbers = typeof allBonusNumbers !== 'undefined' ? allBonusNumbers : [];
    console.log(`Loaded ${recentWinningNumbers.length} past draws.`);

    // Event Listeners
    if (startBtn) startBtn.addEventListener('click', generateNumbers);
    if (resetBtn) resetBtn.addEventListener('click', () => resetGame(ballContainer, startBtn, resetBtn));

    // Sidebar toggle
    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => toggleSidebar(sidebar, sidebarOpen));
    }
    if (sidebarOpen) {
        sidebarOpen.addEventListener('click', () => toggleSidebar(sidebar, sidebarOpen));
    }

    // Initialize components
    initTabNavigation();
    loadHistory();
    initSimulationCanvas();
    renderChart(recentWinningNumbers, recentBonusNumbers);

    /**
     * Generate lottery numbers based on selected algorithm and RNG
     */
    async function generateNumbers() {
        initAudio();

        // 1. Immediate UI Feedback
        const originalBtnText = startBtn ? startBtn.innerText : 'Generate';
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerText = "Generating... ⏳";
            startBtn.classList.add('disabled-look'); // Optional styling
        }
        if (resetBtn) resetBtn.classList.add('hidden');
        if (ballContainer) ballContainer.innerHTML = '';

        // 2. Yield to browser to allow UI repaint (Spinner/Text update)
        // This prevents the "frozen" feeling
        setTimeout(async () => {
            const selectedAlgoInput = document.querySelector('input[name="algorithm"]:checked');
            const selectedAlgo = selectedAlgoInput ? selectedAlgoInput.value : 'random';

            const selectedRngInput = document.querySelector('input[name="rng"]:checked');
            const selectedRngType = selectedRngInput ? selectedRngInput.value : 'prng';

            console.log(`Generating numbers using Algo: ${selectedAlgo}, RNG: ${selectedRngType}`);

            let numbers = [];
            try {
                // Get RNG function (might be async for blockchain/vrf)
                const rngFunc = await getRNG(selectedRngType);

                if (selectedAlgo === 'weighted') {
                    numbers = await getWeightedNumbers(rngFunc);
                } else if (selectedAlgo === 'adaptive') {
                    numbers = await getAdaptiveNumbers(rngFunc);
                } else if (selectedAlgo === 'non-frequency') {
                    numbers = await getNonFrequencyNumbers(rngFunc);
                } else if (selectedAlgo === 'sequential') {
                    numbers = await getSequentialNumbers(rngFunc);
                } else {
                    numbers = await getRandomNumbers(rngFunc);
                }
            } catch (e) {
                console.error("Generation error:", e);
                numbers = await getRandomNumbers(() => Math.random()); // Fallback
            }

            const mainNumbers = numbers.slice(0, CONFIG.MAIN_NUMBERS_COUNT).sort((a, b) => a - b);
            const bonusNumber = numbers[CONFIG.MAIN_NUMBERS_COUNT];

            console.log("Main:", mainNumbers, "Bonus:", bonusNumber);

            let delay = 0;

            // Display Main Numbers
            mainNumbers.forEach((num) => {
                setTimeout(() => {
                    createBall(num, ballContainer);
                    playPopSound();
                }, delay);
                delay += CONFIG.ANIMATION_INTERVAL;
            });

            // Display Bonus Number
            setTimeout(() => {
                ballContainer.appendChild(createPlusSign());

                const bonusBall = createBallElement(bonusNumber, true);
                ballContainer.appendChild(bonusBall);
                playPopSound();

                // Completion Logic
                if (resetBtn) resetBtn.classList.remove('hidden');
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.innerText = originalBtnText;
                    startBtn.classList.remove('hidden'); // Ensure it's visible if we hid it
                    startBtn.classList.remove('disabled-look');
                }

                // Add to history
                addToHistory([...mainNumbers, bonusNumber], selectedAlgo, selectedRngType);

            }, delay);
        }, 50); // Short delay to ensure repaint
    }
});
