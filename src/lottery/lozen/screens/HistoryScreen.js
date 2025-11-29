import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Ball from '../components/Ball';

export default function HistoryScreen() {
    const [history, setHistory] = useState([]);

    const loadHistory = async () => {
        try {
            const savedHistory = await AsyncStorage.getItem('history');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const clearHistory = async () => {
        try {
            await AsyncStorage.removeItem('history');
            setHistory([]);
        } catch (e) {
            console.error("Failed to clear history", e);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.historyItem}>
            <View style={styles.itemHeader}>
                <Text style={styles.dateText}>{new Date(item.date).toLocaleString()}</Text>
                <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>{item.algorithm}</Text>
                    <Text style={styles.tagText}> | </Text>
                    <Text style={styles.tagText}>{item.rngType}</Text>
                </View>
            </View>
            <View style={styles.ballsRow}>
                {item.numbers.slice(0, 6).map((num, idx) => (
                    <Ball key={idx} number={num} size={30} />
                ))}
                <Text style={styles.plusText}>+</Text>
                <Ball number={item.numbers[6]} size={30} isBonus={true} />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>History</Text>
                <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
            </View>

            {history.length > 0 ? (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No history yet.</Text>
                </View>
            )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    clearBtn: {
        padding: 8,
    },
    clearBtnText: {
        color: '#e17055',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    historyItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dateText: {
        fontSize: 12,
        color: '#b2bec3',
    },
    tagContainer: {
        flexDirection: 'row',
    },
    tagText: {
        fontSize: 12,
        color: '#636e72',
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    ballsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    plusText: {
        fontSize: 16,
        color: '#b2bec3',
        marginHorizontal: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#b2bec3',
        fontSize: 16,
    },
});
