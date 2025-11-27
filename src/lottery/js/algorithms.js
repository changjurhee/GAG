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

// Make algorithm functions available globally
window.createPoolAndPick = createPoolAndPick;
window.getWeightedNumbers = getWeightedNumbers;
window.getAdaptiveNumbers = getAdaptiveNumbers;
window.getNonFrequencyNumbers = getNonFrequencyNumbers;
