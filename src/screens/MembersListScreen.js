import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { fetchAllMembers, deleteMember } from '../services/api';

export default function MembersListScreen({ navigation }) {
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadMembers();
        }, [])
    );

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredMembers(members);
        } else {
            const lower = searchQuery.toLowerCase();
            const filtered = members.filter(m =>
                (m.firstName && m.firstName.toLowerCase().includes(lower)) ||
                (m.lastName && m.lastName.toLowerCase().includes(lower)) ||
                (m.phone && m.phone.includes(lower))
            );
            setFilteredMembers(filtered);
        }
    }, [searchQuery, members]);

    const loadMembers = async () => {
        try {
            const data = await fetchAllMembers();
            // Sort by most recent update
            data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setMembers(data);
            setFilteredMembers(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load members');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadMembers();
    };

    const handleExport = async () => {
        if (members.length === 0) return Alert.alert('No Data', 'No members to export.');

        try {
            // Header row
            let csv = 'ID,First Name,Last Name,Phone,Gender,Baptized,Working,Marital Status\n';

            // Data rows
            members.forEach(m => {
                const row = [
                    m.id,
                    m.firstName,
                    m.lastName,
                    m.phone || '',
                    m.gender || '',
                    m.baptized ? 'Yes' : 'No',
                    m.working ? 'Yes' : 'No',
                    m.maritalStatus || ''
                ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',');
                csv += row + '\n';
            });

            const fileName = `members_export_${new Date().getTime()}.csv`;
            const filePath = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(filePath, csv, { encoding: 'utf8' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Export Members' });
            } else {
                Alert.alert('Error', 'Sharing not available');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate CSV');
        }
    };

    const handleDelete = (id, name) => {
        Alert.alert(
            'Delete Member',
            `Are you sure you want to delete ${name}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await deleteMember(id);
                            Alert.alert('Success', 'Member deleted');
                            loadMembers(); // Reload list
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete member');
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.firstName?.[0]}{item.lastName?.[0]}
                    </Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.phone}>
                        {item.phone || 'No Phone'}
                    </Text>
                    <View style={styles.badges}>
                        {item.baptized && <View style={[styles.badge, styles.badgeGreen]}><Text style={styles.badgeText}>Baptized</Text></View>}
                        {item.working && <View style={[styles.badge, styles.badgeYellow]}><Text style={styles.badgeText}>Working</Text></View>}
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.firstName)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
                </TouchableOpacity>
                <Text style={styles.title}>Manage Members</Text>
                <TouchableOpacity onPress={handleExport}>
                    <Ionicons name="download-outline" size={24} color="#1e3a8a" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search name or phone..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#94a3b8"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 40 }} color="#1e3a8a" />
            ) : (
                <FlatList
                    data={filteredMembers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No members found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        height: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: '#1e293b', height: '100%' },

    list: { paddingHorizontal: 16, paddingBottom: 20 },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#eff6ff',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16,
    },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    phone: { fontSize: 14, color: '#64748b', marginTop: 2 },
    badges: { flexDirection: 'row', gap: 6, marginTop: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    badgeGreen: { backgroundColor: '#dcfce7' },
    badgeYellow: { backgroundColor: '#fef3c7' },
    badgeText: { fontSize: 10, fontWeight: '600', color: '#1e293b' },
    deleteBtn: { padding: 8 },
    empty: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, color: '#94a3b8' },
});
