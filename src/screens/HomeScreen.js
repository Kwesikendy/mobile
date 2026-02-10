import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    return (
        <LinearGradient
            colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

            {/* Logo and Title */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/church-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>Church of Pentecost</Text>
                <View style={styles.divider} />
                <Text style={styles.subtitle}>Moree</Text>
            </View>

            {/* Welcome Text */}
            <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>Welcome!</Text>
                <Text style={styles.welcomeSubtext}>Please select an option below</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
                {/* Member Registration Option */}
                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => navigation.navigate('MemberForm')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#ffffff', '#f0f9ff']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.iconCircle}>
                            <Ionicons name="people" size={32} color="#1e3a8a" />
                        </View>
                        <Text style={styles.optionTitle}>Continue as Member</Text>
                        <Text style={styles.optionDescription}>
                            Register or update information
                        </Text>
                        <Ionicons name="arrow-forward-circle" size={28} color="#3b82f6" style={styles.arrow} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Admin Login Option */}
                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => navigation.navigate('AdminLogin')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#ffffff', '#fef3c7']}
                        style={styles.cardGradient}
                    >
                        <View style={[styles.iconCircle, styles.adminIconCircle]}>
                            <MaterialCommunityIcons name="shield-account" size={32} color="#b45309" />
                        </View>
                        <Text style={styles.optionTitle}>Login as Admin</Text>
                        <Text style={styles.optionDescription}>
                            Access dashboard
                        </Text>
                        <Ionicons name="arrow-forward-circle" size={28} color="#f59e0b" style={styles.arrow} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>Powered by Faith & Technology</Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 50,
        marginBottom: 20,
    },
    logoContainer: {
        width: width * 0.25,
        height: width * 0.25,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: (width * 0.25) / 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    logo: {
        width: '80%',
        height: '80%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    divider: {
        width: 50,
        height: 3,
        backgroundColor: '#fbbf24',
        marginVertical: 10,
        borderRadius: 2,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fbbf24',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 6,
    },
    welcomeSubtext: {
        fontSize: 14,
        color: '#e0e7ff',
        fontWeight: '500',
    },
    optionsContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    optionCard: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    cardGradient: {
        padding: 20,
        alignItems: 'center',
        minHeight: 140,
        justifyContent: 'center',
        position: 'relative',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    adminIconCircle: {
        backgroundColor: '#fef3c7',
    },
    optionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 6,
        textAlign: 'center',
    },
    optionDescription: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 8,
    },
    arrow: {
        marginTop: 4,
    },
    footer: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginBottom: 24,
        fontStyle: 'italic',
    },
});
