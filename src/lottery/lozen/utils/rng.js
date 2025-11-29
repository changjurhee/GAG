import * as Crypto from 'expo-crypto';
import { CONFIG } from './config';

/**
 * Random Number Generator implementations
 */

/**
 * Get a random number generator based on the specified type
 * @param {string} type - The RNG type ('prng', 'secure', 'vrf', 'blockchain')
 * @returns {Promise<Function>} An async or sync function that returns a random number between 0 and 1
 */
export async function getRNG(type) {
    switch (type) {
        case 'secure':
            return async () => {
                const array = await Crypto.getRandomValuesAsync(new Uint32Array(1));
                return array[0] / (0xFFFFFFFF + 1);
            };
        case 'vrf':
            // Simulated VRF: Hash(Seed + Counter)
            const seed = Date.now().toString();
            let counter = 0;
            return async () => {
                counter++;
                const msg = seed + counter;
                const hash = await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    msg
                );
                // Hash is hex string, take first 8 chars (32 bits)
                const value = parseInt(hash.substring(0, 8), 16);
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
                    let t = seedVal += 0x6D2B79F5;
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

/**
 * Generate random unique numbers using the provided RNG
 * @param {Function} rng - Random number generator function
 * @param {number} count - Number of unique numbers to generate
 * @param {number} max - Maximum number value (default: 45)
 * @returns {Promise<number[]>} Array of unique random numbers
 */
export async function getRandomNumbers(rng, count = CONFIG.TOTAL_DRAW_COUNT, max = CONFIG.TOTAL_NUMBERS) {
    const numbers = [];
    while (numbers.length < count) {
        const randomVal = await rng();
        const num = Math.floor(randomVal * max) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    return numbers;
}
