import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate logo entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 10,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulsing animation for background circles
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Loading dots animation
        const animateDots = () => {
            Animated.loop(
                Animated.stagger(200, [
                    Animated.sequence([
                        Animated.timing(dotAnim1, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(dotAnim1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                    ]),
                    Animated.sequence([
                        Animated.timing(dotAnim2, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(dotAnim2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                    ]),
                    Animated.sequence([
                        Animated.timing(dotAnim3, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(dotAnim3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                    ]),
                ])
            ).start();
        };

        setTimeout(() => animateDots(), 1000);

        // Navigate to home screen after 4 seconds
        const timer = setTimeout(() => {
            navigation.replace('Home');
        }, 4000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <LinearGradient
            colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

            {/* Animated Background Circles */}
            <Animated.View
                style={[
                    styles.circle1,
                    { transform: [{ scale: pulseAnim }] }
                ]}
            />
            <Animated.View
                style={[
                    styles.circle2,
                    { transform: [{ scale: pulseAnim }] }
                ]}
            />

            {/* Main Content */}
            <View style={styles.content}>
                {/* Logo Container with Animation */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('../../assets/church-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                </Animated.View>

                {/* Title with Slide Animation */}
                <Animated.View
                    style={[
                        styles.textContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.mainTitle}>Church of Pentecost</Text>
                    <View style={styles.divider} />
                    <Text style={styles.subtitle}>Moore District</Text>
                    <Text style={styles.description}>Member Registration Form</Text>
                </Animated.View>

                {/* Loading Indicator */}
                <Animated.View
                    style={[styles.loadingContainer, { opacity: fadeAnim }]}
                >
                    <Animated.View
                        style={[styles.loadingDot, { opacity: dotAnim1 }]}
                    />
                    <Animated.View
                        style={[styles.loadingDot, { opacity: dotAnim2 }]}
                    />
                    <Animated.View
                        style={[styles.loadingDot, { opacity: dotAnim3 }]}
                    />
                </Animated.View>

                {/* Footer */}
                <Animated.Text
                    style={[styles.footer, { opacity: fadeAnim }]}
                >
                    Powered by Faith & Technology
                </Animated.Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    circle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -100,
        right: -100,
    },
    circle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -50,
        left: -50,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        marginBottom: 40,
    },
    logoWrapper: {
        width: width * 0.5,
        height: width * 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: (width * 0.5) / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    logo: {
        width: '85%',
        height: '85%',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    divider: {
        width: 60,
        height: 3,
        backgroundColor: '#fbbf24',
        marginVertical: 15,
        borderRadius: 2,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#fbbf24',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    description: {
        fontSize: 16,
        color: '#e0e7ff',
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    loadingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fbbf24',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontStyle: 'italic',
    },
});
