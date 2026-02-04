import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    Switch,
    ActivityIndicator,
    Platform,
    Animated,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { saveMember } from '../services/database';
import { fetchFormSchema, isOnline } from '../services/api';
import { getCachedFormSchema, cacheFormSchema } from '../services/database';
import { useSync } from '../hooks/useSync';

export default function MemberFormScreen({ navigation }) {
    const [formData, setFormData] = useState({});
    const [schema, setSchema] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { sync, isSyncing, isOnline: online, pendingCount } = useSync();
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        loadFormSchema();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const loadFormSchema = async () => {
        try {
            // Try to fetch from server
            const connected = await isOnline();
            if (connected) {
                const serverSchema = await fetchFormSchema();
                setSchema(serverSchema.elements);
                await cacheFormSchema(serverSchema.version, serverSchema.elements);
            } else {
                // Load from cache
                const cached = await getCachedFormSchema();
                if (cached) {
                    setSchema(cached.elements);
                } else {
                    // Use default schema
                    setSchema(getDefaultSchema());
                }
            }
        } catch (error) {
            console.error('Error loading schema:', error);
            // Fallback to cached or default
            const cached = await getCachedFormSchema();
            setSchema(cached ? cached.elements : getDefaultSchema());
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validate required fields
        const errors = [];
        schema.forEach((field) => {
            if (field.required && !formData[field.name]) {
                errors.push(field.label);
            }
        });

        if (errors.length > 0) {
            Alert.alert('Required Fields', `Please fill in: ${errors.join(', ')}`);
            return;
        }

        setSubmitting(true);

        try {
            // Calculate age from DOB if provided
            let finalData = { ...formData };
            if (formData.dob && !formData.age) {
                finalData.age = calculateAge(formData.dob);
            }


            // Save to local database
            await saveMember(finalData);

            Alert.alert(
                '✅ Success',
                online
                    ? 'Member saved and synced to server!'
                    : 'Member saved offline. Will auto-sync when online.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setFormData({});
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to save member. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const shouldShowField = (field) => {
        if (!field.conditional) return true;
        const fieldValue = formData[field.conditional.field];
        // If negate is true, show field when value does NOT match
        if (field.conditional.negate) {
            return fieldValue !== field.conditional.value;
        }
        // Otherwise, show field when value matches
        return fieldValue === field.conditional.value;
    };

    const getFieldIcon = (fieldName) => {
        const iconMap = {
            firstName: 'person',
            lastName: 'people',
            dob: 'calendar',
            gender: 'male-female',
            phone: 'call',
            address: 'location',
            baptized: 'water',
            waterBaptized: 'water-outline',
            holyGhostBaptized: 'flame',
            presidingElder: 'shield-checkmark',
            working: 'briefcase',
            occupation: 'business',
            maritalStatus: 'heart',
            childrenCount: 'people-circle',
            ministry: 'musical-notes',
            joinedDate: 'calendar-outline',
            prayerRequests: 'chatbubbles',
        };
        return iconMap[fieldName] || 'document-text';
    };

    const renderField = (field) => {
        if (!shouldShowField(field)) return null;

        const value = formData[field.name];
        const icon = getFieldIcon(field.name);

        switch (field.type) {
            case 'text':
            case 'date':
                return (
                    <Animated.View key={field.name} style={[styles.fieldContainer, { opacity: fadeAnim }]}>
                        <View style={styles.labelRow}>
                            <Ionicons name={icon} size={20} color="#1e3a8a" style={styles.labelIcon} />
                            <Text style={styles.label}>
                                {field.label} {field.required && <Text style={styles.required}>*</Text>}
                            </Text>
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={value || ''}
                                onChangeText={(text) => setFormData({ ...formData, [field.name]: text })}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </Animated.View>
                );

            case 'number':
                return (
                    <Animated.View key={field.name} style={[styles.fieldContainer, { opacity: fadeAnim }]}>
                        <View style={styles.labelRow}>
                            <Ionicons name={icon} size={20} color="#1e3a8a" style={styles.labelIcon} />
                            <Text style={styles.label}>
                                {field.label} {field.required && <Text style={styles.required}>*</Text>}
                            </Text>
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={value ? String(value) : ''}
                                onChangeText={(text) => setFormData({ ...formData, [field.name]: parseInt(text) || 0 })}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />
                        </View>
                    </Animated.View>
                );

            case 'textarea':
                return (
                    <Animated.View key={field.name} style={[styles.fieldContainer, { opacity: fadeAnim }]}>
                        <View style={styles.labelRow}>
                            <Ionicons name={icon} size={20} color="#1e3a8a" style={styles.labelIcon} />
                            <Text style={styles.label}>
                                {field.label} {field.required && <Text style={styles.required}>*</Text>}
                            </Text>
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                value={value || ''}
                                onChangeText={(text) => setFormData({ ...formData, [field.name]: text })}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </Animated.View>
                );

            case 'boolean':
                return (
                    <Animated.View key={field.name} style={[styles.fieldContainer, { opacity: fadeAnim }]}>
                        <View style={styles.switchRow}>
                            <View style={styles.labelRow}>
                                <Ionicons name={icon} size={20} color="#1e3a8a" style={styles.labelIcon} />
                                <Text style={styles.label}>
                                    {field.label} {field.required && <Text style={styles.required}>*</Text>}
                                </Text>
                            </View>
                            <Switch
                                value={value || false}
                                onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
                                trackColor={{ false: '#ccc', true: '#3b82f6' }}
                                thumbColor={value ? '#1e3a8a' : '#f4f3f4'}
                            />
                        </View>
                    </Animated.View>
                );

            case 'select':
                return (
                    <Animated.View key={field.name} style={[styles.fieldContainer, { opacity: fadeAnim }]}>
                        <View style={styles.labelRow}>
                            <Ionicons name={icon} size={20} color="#1e3a8a" style={styles.labelIcon} />
                            <Text style={styles.label}>
                                {field.label} {field.required && <Text style={styles.required}>*</Text>}
                            </Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={value || ''}
                                onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
                                style={styles.picker}
                            >
                                <Picker.Item label={`Select ${field.label}`} value="" />
                                {field.options?.map((option) => (
                                    <Picker.Item key={option} label={option} value={option} />
                                ))}
                            </Picker>
                        </View>
                    </Animated.View>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Loading form...</Text>
            </LinearGradient>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1e3a8a', '#2563eb', '#3b82f6']} style={styles.header}>
                <View style={styles.headerContent}>
                    <MaterialCommunityIcons name="church" size={32} color="#fff" />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.title}>Moore District</Text>
                        <Text style={styles.subtitle}>Member Registration</Text>
                    </View>
                </View>
                <View style={styles.statusBar}>
                    <View style={styles.statusItem}>
                        <Ionicons
                            name={online ? 'cloud-done' : 'cloud-offline'}
                            size={16}
                            color={online ? '#4ade80' : '#fbbf24'}
                        />
                        <Text style={styles.statusText}>{online ? 'Online' : 'Offline'}</Text>
                    </View>
                    {pendingCount > 0 && (
                        <View style={styles.pendingBadge}>
                            <Ionicons name="sync" size={14} color="#fff" />
                            <Text style={styles.pendingText}>{pendingCount} pending</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {schema.map((field) => renderField(field))}

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    <LinearGradient
                        colors={submitting ? ['#999', '#666'] : ['#1e3a8a', '#3b82f6']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.submitButtonText}>Submit Registration</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Ionicons name="shield-checkmark" size={16} color="#999" />
                    <Text style={styles.footerText}>Your data is secure and encrypted</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const getDefaultSchema = () => [
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'dob', label: 'Date of Birth', type: 'date', required: false },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: false },
    { name: 'phone', label: 'Phone Number', type: 'text', required: false },
    { name: 'address', label: 'Address', type: 'textarea', required: false },
    { name: 'baptized', label: 'Baptized?', type: 'boolean', required: false },
    { name: 'waterBaptized', label: 'Water Baptism?', type: 'boolean', required: false, conditional: { field: 'baptized', value: true } },
    { name: 'holyGhostBaptized', label: 'Holy Ghost Baptism?', type: 'boolean', required: false, conditional: { field: 'baptized', value: true } },
    { name: 'presidingElder', label: 'Presiding Elder Name', type: 'text', required: false },
    { name: 'working', label: 'Working?', type: 'boolean', required: false },
    {
        name: 'occupation',
        label: 'Occupation Category',
        type: 'text',
        required: false,
        conditional: { field: 'working', value: true },
    },
    { name: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'], required: false },
    { name: 'childrenCount', label: 'Number of Children', type: 'number', required: false, conditional: { field: 'maritalStatus', value: 'Single', negate: true } },
    { name: 'ministry', label: 'Ministry/Department', type: 'select', options: ['Choir', 'Ushering', 'Youth', 'Prayer', 'Other'], required: false },
    { name: 'joinedDate', label: 'Date Joined Church', type: 'date', required: false },
    { name: 'prayerRequests', label: 'Prayer Requests', type: 'textarea', required: false },
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
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
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTextContainer: {
        marginLeft: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#e0e7ff',
        marginTop: 2,
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    pendingText: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelIcon: {
        marginRight: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    required: {
        color: '#ef4444',
    },
    inputWrapper: {
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    input: {
        padding: 14,
        fontSize: 16,
        color: '#333',
    },
    textarea: {
        height: 100,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    picker: {
        height: 50,
    },
    submitButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonGradient: {
        flexDirection: 'row',
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    syncButton: {
        marginTop: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#1e3a8a',
        overflow: 'hidden',
    },
    syncButtonContent: {
        flexDirection: 'row',
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    syncButtonText: {
        color: '#1e3a8a',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 20,
        gap: 6,
    },
    footerText: {
        color: '#999',
        fontSize: 12,
    },
});
