import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ball from '../components/Ball';
import { CONFIG } from '../utils/config';
import { getRNG, getRandomNumbers } from '../utils/rng';
import { getWeightedNumbers, getAdaptiveNumbers, getNonFrequencyNumbers } from '../utils/algorithms';
import { allWinningNumbers } from '../data/winning_numbers';

export default function HomeScreen() {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [algorithm, setAlgorithm] = useState('random'); // random, weighted, adaptive, cold
    const [rngType, setRngType] = useState('secure'); // prng, secure, vrf, blockchain

    const generateNumbers = async () => {
        setLoading(true);
        setNumbers([]); // Clear previous
        Vibration.vibrate(50);

        try {
            // Get RNG function
            const rngFunc = await getRNG(rngType);

            let generated = [];

            // Select Algorithm
            switch (algorithm) {
                case 'weighted':
                    generated = await getWeightedNumbers(rngFunc, allWinningNumbers);
                    break;
                case 'adaptive':
                    generated = await getAdaptiveNumbers(rngFunc, allWinningNumbers);
                    break;
                case 'cold':
                    generated = await getNonFrequencyNumbers(rngFunc, allWinningNumbers);
                    break;
                case 'random':
                default:
                    generated = await getRandomNumbers(rngFunc);
                    break;
            }

            // Separate Main and Bonus
            // Note: Our algorithms return 7 numbers. 
            // We'll treat the first 6 as main (sorted) and the 7th as bonus.
            const main = generated.slice(0, 6).sort((a, b) => a - b);
            const bonus = generated[6];

            // Animate display (simulate by setting state with delay if we wanted, 
            // but for React Native simple state update is better for now, maybe add animation later)
            const result = [...main, bonus];

            setNumbers(result);
            Vibration.vibrate([0, 50, 100, 50]); // Success vibration pattern

            // Save to History
            const historyItem = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                numbers: result,
                algorithm,
                rngType
            };

            try {
                const existingHistory = await AsyncStorage.getItem('history');
                const history = existingHistory ? JSON.parse(existingHistory) : [];
                const newHistory = [historyItem, ...history].slice(0, 50); // Keep last 50
                await AsyncStorage.setItem('history', JSON.stringify(newHistory));
            } catch (e) {
                console.error("Failed to save history", e);
            }

        } catch (error) {
            console.error("Generation failed:", error);
            alert("Generation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.header}>
                <Text style={styles.title}>Lotto 6/45</Text>
                <Text style={styles.subtitle}>Lozen Generator</Text>
            </View>

            <View style={styles.resultContainer}>
                {numbers.length > 0 ? (
                    <View style={styles.ballsRow}>
                        {numbers.slice(0, 6).map((num, idx) => (
                            <Ball key={idx} number={num} size={42} />
                        ))}
                        <View style={styles.plusSign}>
                            <Text style={styles.plusText}>+</Text>
                        </View>
                        <Ball number={numbers[6]} size={42} isBonus={true} />
                    </View>
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>Ready to Win?</Text>
                        <Text style={styles.placeholderSubText}>Press the button below</Text>
                    </View>
                )}
            </View>

            <View style={styles.controls}>
                <Text style={styles.sectionTitle}>Algorithm</Text>
                <View style={styles.optionsRow}>
                    {['random', 'weighted', 'adaptive', 'cold'].map((algo) => (
                        <TouchableOpacity
                            key={algo}
                            style={[styles.optionBtn, algorithm === algo && styles.optionBtnActive]}
                            onPress={() => setAlgorithm(algo)}
                        >
                            <Text style={[styles.optionText, algorithm === algo && styles.optionTextActive]}>
                                {algo.charAt(0).toUpperCase() + algo.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>RNG Source</Text>
                <View style={styles.optionsRow}>
                    {['prng', 'secure', 'vrf', 'blockchain'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.optionBtn, rngType === type && styles.optionBtnActive]}
                            onPress={() => setRngType(type)}
                        >
                            <Text style={[styles.optionText, rngType === type && styles.optionTextActive]}>
                                {type === 'blockchain' ? 'Block' : type.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
                    onPress={generateNumbers}
                    disabled={loading}
                >
                    <Text style={styles.generateBtnText}>
                        {loading ? 'Generating...' : 'Generate Numbers'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#2d3436',
    },
    subtitle: {
        fontSize: 16,
        color: '#636e72',
        marginTop: 5,
    },
    resultContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    ballsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    plusSign: {
        marginHorizontal: 5,
    },
    plusText: {
        fontSize: 20,
        color: '#b2bec3',
        fontWeight: 'bold',
    },
    placeholder: {
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#dfe6e9',
    },
    placeholderSubText: {
        fontSize: 14,
        color: '#b2bec3',
        marginTop: 5,
    },
    controls: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636e72',
        marginBottom: 10,
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    optionBtn: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dfe6e9',
    },
    optionBtnActive: {
        backgroundColor: '#6c5ce7',
        borderColor: '#6c5ce7',
    },
    optionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#636e72',
    },
    optionTextActive: {
        color: '#fff',
    },
    footer: {
        padding: 20,
        marginTop: 'auto',
    },
    generateBtn: {
        backgroundColor: '#0984e3',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: "#0984e3",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    generateBtnDisabled: {
        backgroundColor: '#74b9ff',
    },
    generateBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
