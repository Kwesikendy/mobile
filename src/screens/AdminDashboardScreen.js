import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAllMembers, logoutAdmin } from '../services/api';

export default function AdminDashboardScreen({ navigation }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        baptized: 0,
        working: 0,
        married: 0,
    });

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            const data = await fetchAllMembers();
            setMembers(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error loading members:', error);
            Alert.alert('Error', 'Failed to load members. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (data) => {
        setStats({
            total: data.length,
            baptized: data.filter((m) => m.baptized).length,
            working: data.filter((m) => m.working).length,
            married: data.filter((m) => m.maritalStatus === 'Married').length,
        });
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadMembers();
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    logoutAdmin();
                    navigation.replace('Home');
                },
            },
        ]);
    };

    if (loading) {
        return (
            <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </LinearGradient>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#1e3a8a', '#2563eb', '#3b82f6']} style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Admin Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Moree</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                            <Ionicons name="people" size={28} color="#1e3a8a" />
                        </View>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total Members</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="water" size={28} color="#15803d" />
                        </View>
                        <Text style={styles.statValue}>{stats.baptized}</Text>
                        <Text style={styles.statLabel}>Baptized</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="briefcase" size={28} color="#b45309" />
                        </View>
                        <Text style={styles.statValue}>{stats.working}</Text>
                        <Text style={styles.statLabel}>Working</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
                            <Ionicons name="heart" size={28} color="#be123c" />
                        </View>
                        <Text style={styles.statValue}>{stats.married}</Text>
                        <Text style={styles.statLabel}>Married</Text>
                    </View>
                </View>

                {/* Members List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Members</Text>
                    {members.slice(0, 10).map((member) => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberInfo}>
                                <View style={styles.memberAvatar}>
                                    <Text style={styles.memberInitials}>
                                        {member.firstName?.[0]}{member.lastName?.[0]}
                                    </Text>
                                </View>
                                <View style={styles.memberDetails}>
                                    <Text style={styles.memberName}>
                                        {member.firstName} {member.lastName}
                                    </Text>
                                    <View style={styles.memberMeta}>
                                        <Ionicons name="call" size={14} color="#64748b" />
                                        <Text style={styles.memberPhone}>{member.phone || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.memberBadges}>
                                {member.baptized && (
                                    <View style={[styles.badge, styles.baptizedBadge]}>
                                        <Ionicons name="water" size={12} color="#15803d" />
                                    </View>
                                )}
                                {member.working && (
                                    <View style={[styles.badge, styles.workingBadge]}>
                                        <Ionicons name="briefcase" size={12} color="#b45309" />
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}

                    {members.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No members registered yet</Text>
                        </View>
                    )}
                </View>

                {/* Admin Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Admin Controls</Text>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('SchemaBuilder')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="construct" size={24} color="#b45309" />
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Form Builder</Text>
                            <Text style={styles.actionDesc}>Edit registration form fields</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('MembersList')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                            <Ionicons name="people" size={24} color="#1e3a8a" />
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Manage Members</Text>
                            <Text style={styles.actionDesc}>Edit or delete members</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
                    <Text style={styles.infoText}>
                        You are logged in as Admin. Changes to the Form Builder will be reflected for all users immediately.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    // ... (Keep existing styles)
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#e0e7ff',
        marginTop: 4,
    },
    logoutButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    // New Action Card Styles
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    actionIcon: {
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16,
    },
    actionInfo: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    actionDesc: { fontSize: 13, color: '#64748b' },

    // Existing Member Card Styles...
    memberCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    // ... Rest of existing styles ensure no breaks
    memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    memberAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    memberInitials: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    memberDetails: { flex: 1 },
    memberName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
    memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    memberPhone: { fontSize: 14, color: '#64748b' },
    memberBadges: { flexDirection: 'row', gap: 6 },
    badge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    baptizedBadge: { backgroundColor: '#dcfce7' },
    workingBadge: { backgroundColor: '#fef3c7' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 16 },
    infoCard: { flexDirection: 'row', backgroundColor: '#eff6ff', padding: 16, margin: 16, borderRadius: 12, gap: 12 },
    infoText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 18 },
});
