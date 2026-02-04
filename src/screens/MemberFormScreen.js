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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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

    useEffect(() => {
        loadFormSchema();
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
                'Success',
                online
                    ? 'Member saved! Syncing to server...'
                    : 'Member saved offline. Will sync when online.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setFormData({});
                            if (online) {
                                sync();
                            }
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
        return formData[field.conditional.field] === field.conditional.value;
    };

    const renderField = (field) => {
        if (!shouldShowField(field)) return null;

        const value = formData[field.name];

        switch (field.type) {
            case 'text':
            case 'date':
                return (
                    <View key={field.name} style={styles.fieldContainer}>
                        <Text style={styles.label}>
                            {field.label} {field.required && <Text style={styles.required}>*</Text>}
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={value || ''}
                            onChangeText={(text) => setFormData({ ...formData, [field.name]: text })}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            placeholderTextColor="#999"
                        />
                    </View>
                );

            case 'number':
                return (
                    <View key={field.name} style={styles.fieldContainer}>
                        <Text style={styles.label}>
                            {field.label} {field.required && <Text style={styles.required}>*</Text>}
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={value ? String(value) : ''}
                            onChangeText={(text) => setFormData({ ...formData, [field.name]: parseInt(text) || 0 })}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </View>
                );

            case 'textarea':
                return (
                    <View key={field.name} style={styles.fieldContainer}>
                        <Text style={styles.label}>
                            {field.label} {field.required && <Text style={styles.required}>*</Text>}
                        </Text>
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
                );

            case 'boolean':
                return (
                    <View key={field.name} style={styles.fieldContainer}>
                        <View style={styles.switchRow}>
                            <Text style={styles.label}>
                                {field.label} {field.required && <Text style={styles.required}>*</Text>}
                            </Text>
                            <Switch
                                value={value || false}
                                onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
                                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                                thumbColor={value ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                    </View>
                );

            case 'select':
                return (
                    <View key={field.name} style={styles.fieldContainer}>
                        <Text style={styles.label}>
                            {field.label} {field.required && <Text style={styles.required}>*</Text>}
                        </Text>
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
                    </View>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Loading form...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Church Member Registration</Text>
                <View style={styles.statusBar}>
                    <View style={[styles.statusDot, { backgroundColor: online ? '#4CAF50' : '#f44336' }]} />
                    <Text style={styles.statusText}>{online ? 'Online' : 'Offline'}</Text>
                    {pendingCount > 0 && (
                        <Text style={styles.pendingText}>({pendingCount} pending sync)</Text>
                    )}
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {schema.map((field) => renderField(field))}

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit</Text>
                    )}
                </TouchableOpacity>

                {pendingCount > 0 && online && (
                    <TouchableOpacity
                        style={styles.syncButton}
                        onPress={sync}
                        disabled={isSyncing}
                    >
                        {isSyncing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.syncButtonText}>Sync Now ({pendingCount})</Text>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const getDefaultSchema = () => [
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'dob', label: 'Date of Birth', type: 'date', required: false },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: false },
    { name: 'phone', label: 'Phone Number', type: 'text', required: false },
    { name: 'address', label: 'Address', type: 'textarea', required: false },
    { name: 'baptized', label: 'Baptized?', type: 'boolean', required: false },
    { name: 'waterBaptized', label: 'Water Baptism?', type: 'boolean', required: false },
    { name: 'holyGhostBaptized', label: 'Holy Ghost Baptism?', type: 'boolean', required: false },
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
    { name: 'childrenCount', label: 'Number of Children', type: 'number', required: false },
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
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#1e3a8a',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
    },
    pendingText: {
        color: '#ffd700',
        fontSize: 12,
        marginLeft: 5,
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
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#f44336',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
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
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    submitButton: {
        backgroundColor: '#1e3a8a',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#999',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    syncButton: {
        backgroundColor: '#4CAF50',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
