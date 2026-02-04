import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        // Navigate to form after 3 seconds
        const timer = setTimeout(() => {
            navigation.replace('MemberForm');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/church-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e3a8a', // Deep blue background
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: width * 0.8,
        height: height * 0.4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
});
