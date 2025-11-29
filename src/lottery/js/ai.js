/**
 * Deep Learning / RL Module using TensorFlow.js
 */

let model = null;
let isTraining = false;

/**
 * Prepare data for LSTM
 * Input: Sequence of N draws
 * Output: Next draw
 */
function prepareData(history, windowSize = 5) {
    const xs = [];
    const ys = [];

    // Flatten history into a single sequence of numbers for simplicity in this demo
    // Or treat each draw as a timestep. 
    // Let's treat each draw (sorted) as a feature vector of size 6? 
    // No, 6/45 is hard to predict as a vector.
    // Let's try to predict the "next number" given a sequence of numbers.

    // Simplified approach: One-hot encode numbers? No, too sparse.
    // Normalized numbers (0-1).

    const flatNumbers = [];
    history.forEach(draw => {
        if (Array.isArray(draw)) flatNumbers.push(...draw);
    });

    for (let i = 0; i < flatNumbers.length - windowSize; i++) {
        const x = flatNumbers.slice(i, i + windowSize).map(n => n / 45);
        const y = flatNumbers[i + windowSize] / 45;
        xs.push(x);
        ys.push(y);
    }

    return {
        xs: tf.tensor2d(xs, [xs.length, windowSize]),
        ys: tf.tensor2d(ys, [ys.length, 1])
    };
}

/**
 * Build and Train Model
 */
async function trainAIModel(progressCallback) {
    if (isTraining) return;
    isTraining = true;

    const history = typeof allWinningNumbers !== 'undefined' ? allWinningNumbers : [];
    if (history.length < 10) {
        alert("Not enough history to train!");
        isTraining = false;
        return;
    }

    // Define model
    model = tf.sequential();
    model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [5] })); // Simple Dense for speed
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Output 0-1

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    const { xs, ys } = prepareData(history);

    await model.fit(xs, ys, {
        epochs: 20,
        batchSize: 32,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                if (progressCallback) progressCallback(epoch + 1, logs.loss);
            }
        }
    });

    xs.dispose();
    ys.dispose();
    isTraining = false;
    console.log("AI Training Complete");
}

/**
 * Generate numbers using the trained model
 */
async function getDeepLearningNumbers(rng) {
    if (!model) {
        // Fallback if not trained
        console.warn("Model not trained, using Sequential fallback");
        return window.getSequentialNumbers(rng);
    }

    const result = [];
    const history = typeof allWinningNumbers !== 'undefined' ? allWinningNumbers : [];

    // Start with the last 5 numbers from history
    let lastDraw = history[0] || [1, 2, 3, 4, 5, 6];
    let inputSeq = lastDraw.slice(0, 5).map(n => n / 45);

    while (result.length < 7) { // 6 main + 1 bonus
        // Predict
        const input = tf.tensor2d([inputSeq], [1, 5]);
        const prediction = model.predict(input);
        const predValue = (await prediction.data())[0];

        input.dispose();
        prediction.dispose();

        // Convert back to 1-45
        let num = Math.round(predValue * 45);
        if (num < 1) num = 1;
        if (num > 45) num = 45;

        // Add randomness (Temperature) to avoid loops and allow exploration
        // RL concept: Epsilon-Greedy
        const r = await rng();
        if (r < 0.3 || result.includes(num)) { // 30% exploration or if duplicate
            // Pick random available
            const available = [];
            for (let i = 1; i <= 45; i++) {
                if (!result.includes(i)) available.push(i);
            }
            num = available[Math.floor(r * available.length)];
        }

        result.push(num);

        // Update sequence
        inputSeq.shift();
        inputSeq.push(num / 45);
    }

    return result;
}

// Export
window.trainAIModel = trainAIModel;
window.getDeepLearningNumbers = getDeepLearningNumbers;
