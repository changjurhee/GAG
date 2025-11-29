import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CONFIG } from '../utils/config';

export default function Ball({ number, size = 40, isBonus = false }) {
    // Determine color based on range
    let backgroundColor = '#b2bec3'; // Default grey

    for (const range of CONFIG.RANGES) {
        if (number <= range.max) {
            backgroundColor = range.color;
            break;
        }
    }

    return (
        <View style={[
            styles.container,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor
            },
            isBonus && styles.bonus
        ]}>
            <View style={styles.shine} />
            <Text style={[styles.text, { fontSize: size * 0.5 }]}>{number}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'relative',
        overflow: 'hidden',
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    shine: {
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '30%',
        height: '30%',
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        transform: [{ rotate: '45deg' }],
    },
    bonus: {
        borderWidth: 2,
        borderColor: '#fff',
    }
});
