/**
 * Number generation algorithms for the Lottery Generator
 */

/**
 * Create a weighted pool and pick numbers from it
 * @param {Object} weights - Object mapping numbers to their weights
 * @param {number} power - Power to apply to weights
 * @param {Function} rng - Random number generator function
 * @returns {Promise<number[]>} Array of selected numbers
 */
async function createPoolAndPick(weights, power, rng) {
    const pool = [];
    for (const [num, weight] of Object.entries(weights)) {
        const count = Math.round(Math.pow(weight, power) * 10);
        for (let k = 0; k < count; k++) {
            pool.push(parseInt(num));
        }
    }

    const result = [];
    while (result.length < CONFIG.TOTAL_DRAW_COUNT) {
        const randomVal = await rng();
        const index = Math.floor(randomVal * pool.length);
        const num = pool[index];
        if (!result.includes(num)) {
            result.push(num);
        }
    }
    return result;
}

/**
 * Generate numbers using frequency-weighted selection
 * Numbers that appear more often in history have higher weight
 * @param {Function} rng - Random number generator function
 * @param {Array} winningNumbers - Historical winning numbers
 * @returns {Promise<number[]>} Array of selected numbers
 */
async function getWeightedNumbers(rng, winningNumbers = []) {
    const frequency = {};
    for (let i = 1; i <= CONFIG.TOTAL_NUMBERS; i++) {
        frequency[i] = 1; // Base weight
    }

    winningNumbers.forEach(draw => {
        if (Array.isArray(draw)) {
            draw.forEach(num => {
                if (frequency[num]) {
                    frequency[num] += 1;
                }
            });
        }
    });

    return createPoolAndPick(frequency, CONFIG.WEIGHTED_POWER, rng);
}

/**
 * Generate numbers using adaptive/trend-based selection
 * Recent numbers have higher weight, with decay over time
 * @param {Function} rng - Random number generator function
 * @param {Array} winningNumbers - Historical winning numbers
 * @returns {Promise<number[]>} Array of selected numbers
 */
async function getAdaptiveNumbers(rng, winningNumbers = []) {
    const weights = {};
    for (let i = 1; i <= CONFIG.TOTAL_NUMBERS; i++) {
        weights[i] = 1.0;
    }

    const history = [...winningNumbers];

    for (let i = history.length - 1; i >= 0; i--) {
        const draw = history[i];
        if (!Array.isArray(draw)) continue;

        for (let w = 1; w <= CONFIG.TOTAL_NUMBERS; w++) {
            weights[w] *= CONFIG.ADAPTIVE_DECAY_RATE;
        }

        draw.forEach(num => {
            if (weights[num] !== undefined) {
                weights[num] += CONFIG.ADAPTIVE_REWARD;
            }
        });
    }

    return createPoolAndPick(weights, CONFIG.ADAPTIVE_POWER, rng);
}

/**
 * Generate numbers using non-frequency (cold number) selection
 * Numbers that appear less often in history have higher weight
 * @param {Function} rng - Random number generator function
 * @param {Array} winningNumbers - Historical winning numbers
 * @returns {Promise<number[]>} Array of selected numbers
 */
async function getNonFrequencyNumbers(rng, winningNumbers = []) {
    const frequency = {};
    for (let i = 1; i <= CONFIG.TOTAL_NUMBERS; i++) {
        frequency[i] = 0;
    }

    winningNumbers.forEach(draw => {
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
    for (let i = 1; i <= CONFIG.TOTAL_NUMBERS; i++) {
        // Add 1 to avoid division by zero and ensure base weight
        // Use inverse: 100 / (freq + 1)
        weights[i] = 100 / (frequency[i] + 1);
    }

    return createPoolAndPick(weights, CONFIG.WEIGHTED_POWER, rng);
}

/**
 * Generate numbers using Sequential Analysis (Markov Chain)
 * Analyzes the probability of Number B following Number A in sorted draws.
 * @param {Function} rng - Random number generator function
 * @returns {Promise<number[]>} Array of selected numbers
 */
async function getSequentialNumbers(rng) {
    const transitions = {}; // { 1: { 2: 5, 3: 2 }, ... }
    const firstNumbers = {}; // { 1: 10, 2: 5, ... }

    // 1. Build Transition Matrix from History
    const history = typeof allWinningNumbers !== 'undefined' ? allWinningNumbers : [];

    history.forEach(draw => {
        if (!Array.isArray(draw) || draw.length < 6) return;

        // Sort to ensure sequence
        const sortedDraw = [...draw].sort((a, b) => a - b);

        // Record first number
        const first = sortedDraw[0];
        firstNumbers[first] = (firstNumbers[first] || 0) + 1;

        // Record transitions
        for (let i = 0; i < sortedDraw.length - 1; i++) {
            const current = sortedDraw[i];
            const next = sortedDraw[i + 1];

            if (!transitions[current]) transitions[current] = {};
            transitions[current][next] = (transitions[current][next] || 0) + 1;
        }
    });

    const result = [];

    // 2. Pick First Number
    const firstNum = await pickFromWeights(firstNumbers, rng);
    result.push(firstNum);

    // 3. Pick Subsequent Numbers
    let currentNum = firstNum;

    while (result.length < 6) {
        let nextNum;

        // Check if we have transition data for current number
        if (transitions[currentNum]) {
            // Filter out numbers already picked to avoid duplicates
            const candidates = { ...transitions[currentNum] };
            result.forEach(picked => delete candidates[picked]);

            if (Object.keys(candidates).length > 0) {
                // Pick based on transition probability
                nextNum = await pickFromWeights(candidates, rng);
            }
        }

        // Fallback: If no transition data or all candidates picked
        if (!nextNum) {
            // Pick a random number greater than current (to maintain sorted order preference if possible)
            // But standard lottery doesn't strictly require sorted generation, just unique.
            // Let's pick any available number, preferably higher to mimic typical sequence.
            const available = [];
            for (let i = 1; i <= 45; i++) {
                if (!result.includes(i)) available.push(i);
            }

            // Try to pick higher numbers first to look natural
            const higher = available.filter(n => n > currentNum);
            if (higher.length > 0) {
                const r = await rng();
                nextNum = higher[Math.floor(r * higher.length)];
            } else {
                const r = await rng();
                nextNum = available[Math.floor(r * available.length)];
            }
        }

        result.push(nextNum);
        currentNum = nextNum;
    }

    // 4. Pick Bonus Number (Randomly from remaining)
    const availableForBonus = [];
    for (let i = 1; i <= 45; i++) {
        if (!result.includes(i)) availableForBonus.push(i);
    }
    const r = await rng();
    const bonus = availableForBonus[Math.floor(r * availableForBonus.length)];
    result.push(bonus);

    return result;
}

/**
 * Helper to pick a key from a weight object
 */
async function pickFromWeights(weights, rng) {
    let totalWeight = 0;
    for (const w of Object.values(weights)) totalWeight += w;

    const r = await rng();
    let randomWeight = r * totalWeight;

    for (const [num, weight] of Object.entries(weights)) {
        randomWeight -= weight;
        if (randomWeight <= 0) return parseInt(num);
    }

    // Fallback (should rarely happen due to float precision)
    return parseInt(Object.keys(weights)[0]);
}

// Make algorithm functions available globally
window.createPoolAndPick = createPoolAndPick;
window.getWeightedNumbers = getWeightedNumbers;
window.getAdaptiveNumbers = getAdaptiveNumbers;
window.getNonFrequencyNumbers = getNonFrequencyNumbers;
window.getSequentialNumbers = getSequentialNumbers;
