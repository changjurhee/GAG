const CONFIG = require('../js/config');
// Mock global CONFIG for algorithms.js
global.CONFIG = CONFIG;

const { getWeightedNumbers, getAdaptiveNumbers } = require('../js/algorithms');

describe('Lottery Algorithms', () => {
    // Mock RNG that returns a predictable sequence or just random
    const mockRng = jest.fn(() => Promise.resolve(Math.random()));

    test('getWeightedNumbers returns correct count of numbers', async () => {
        const numbers = await getWeightedNumbers(mockRng, []);
        expect(numbers).toHaveLength(7); // 6 main + 1 bonus

        // Check ranges
        numbers.forEach(num => {
            expect(num).toBeGreaterThanOrEqual(1);
            expect(num).toBeLessThanOrEqual(45);
        });
    });

    test('getWeightedNumbers returns unique numbers', async () => {
        const numbers = await getWeightedNumbers(mockRng, []);
        const unique = new Set(numbers);
        expect(unique.size).toBe(7);
    });
});
