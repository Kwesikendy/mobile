import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Switch,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchFormSchema, updateFormSchema } from '../services/api';

export default function SchemaBuilderScreen({ navigation }) {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingField, setEditingField] = useState(null); // null = new, object = edit
    const [tempField, setTempField] = useState({
        name: '', label: '', type: 'text', required: false, options: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const schema = await fetchFormSchema();
            // Ensure array
            const elements = schema.elements || schema;
            setFields(Array.isArray(elements) ? elements : []);
        } catch (error) {
            Alert.alert('Error', 'Failed to load schema');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchema = async () => {
        setSaving(true);
        try {
            await updateFormSchema(fields);
            Alert.alert('Success', 'Form updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to save schema');
        } finally {
            setSaving(false);
        }
    };

    const moveField = (index, direction) => {
        const newFields = [...fields];
        if (direction === 'up' && index > 0) {
            [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
        } else if (direction === 'down' && index < newFields.length - 1) {
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
        }
        setFields(newFields);
    };

    const deleteField = (index) => {
        Alert.alert('Delete Field', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    const newFields = fields.filter((_, i) => i !== index);
                    setFields(newFields);
                }
            }
        ]);
    };

    const openEditor = (field = null) => {
        if (field) {
            setTempField({
                ...field,
                options: field.options ? field.options.join(',') : ''
            });
            setEditingField(field);
        } else {
            setTempField({
                name: `field_${Date.now()}`,
                label: '',
                type: 'text',
                required: false,
                options: ''
            });
            setEditingField(null);
        }
        setModalVisible(true);
    };

    const saveFieldFromModal = () => {
        if (!tempField.label) return Alert.alert('Error', 'Label is required');

        // Process options
        const processedField = {
            ...tempField,
            options: tempField.type === 'select' ? tempField.options.split(',').map(s => s.trim()) : undefined
        };

        if (editingField) {
            setFields(fields.map(f => f.name === editingField.name ? processedField : f));
        } else {
            setFields([...fields, processedField]);
        }
        setModalVisible(false);
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.fieldCard}>
            <View style={styles.fieldInfo}>
                <Text style={styles.fieldLabel}>{item.label}</Text>
                <Text style={styles.fieldType}>
                    {item.type} {item.required && '• Required'}
                </Text>
            </View>
            <View style={styles.fieldActions}>
                <TouchableOpacity onPress={() => moveField(index, 'up')} disabled={index === 0}>
                    <Ionicons name="arrow-up" size={20} color={index === 0 ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveField(index, 'down')} disabled={index === fields.length - 1}>
                    <Ionicons name="arrow-down" size={20} color={index === fields.length - 1 ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEditor(item)}>
                    <Ionicons name="create-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteField(index)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
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
                <Text style={styles.title}>Schema Builder</Text>
                <TouchableOpacity onPress={handleSaveSchema} disabled={saving}>
                    {saving ? <ActivityIndicator color="#1e3a8a" /> : <Ionicons name="save" size={24} color="#1e3a8a" />}
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={fields}
                    keyExtractor={(item) => item.name}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => openEditor(null)}>
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Editor Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>{editingField ? 'Edit Field' : 'New Field'}</Text>

                            <Text style={styles.label}>Label</Text>
                            <TextInput
                                style={styles.input}
                                value={tempField.label}
                                onChangeText={t => setTempField({ ...tempField, label: t })}
                                placeholder="e.g. Favorite Color"
                            />

                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeRow}>
                                {['text', 'number', 'date', 'select', 'boolean'].map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.typeChip, tempField.type === t && styles.typeChipActive]}
                                        onPress={() => setTempField({ ...tempField, type: t })}
                                    >
                                        <Text style={[styles.typeText, tempField.type === t && styles.typeTextActive]}>
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {tempField.type === 'select' && (
                                <>
                                    <Text style={styles.label}>Options (comma separated)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={tempField.options}
                                        onChangeText={t => setTempField({ ...tempField, options: t })}
                                        placeholder="Red, Blue, Green"
                                    />
                                </>
                            )}

                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Required?</Text>
                                <Switch
                                    value={tempField.required}
                                    onValueChange={v => setTempField({ ...tempField, required: v })}
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={saveFieldFromModal}>
                                    <Text style={styles.saveText}>Save Field</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    list: { padding: 16, paddingBottom: 100 },
    fieldCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    fieldLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    fieldType: { fontSize: 13, color: '#64748b', marginTop: 2 },
    fieldActions: { flexDirection: 'row', gap: 15 },
    fab: {
        position: 'absolute',
        bottom: 30, right: 30,
        width: 60, height: 60,
        backgroundColor: '#fbbf24',
        borderRadius: 30,
        justifyContent: 'center', alignItems: 'center',
        elevation: 5,
    },
    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', padding: 20
    },
    modalContent: {
        backgroundColor: 'white', borderRadius: 16, padding: 24,
        maxHeight: '80%'
    },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
        padding: 12, fontSize: 16, color: '#1e293b'
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, backgroundColor: '#f1f5f9'
    },
    typeChipActive: { backgroundColor: '#3b82f6' },
    typeText: { color: '#64748b', fontSize: 13 },
    typeTextActive: { color: 'white' },
    switchRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 20, marginBottom: 20
    },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 10 },
    cancelBtn: { flex: 1, padding: 14, alignItems: 'center' },
    cancelText: { color: '#64748b', fontWeight: '600' },
    saveBtn: { flex: 1, backgroundColor: '#1e3a8a', padding: 14, borderRadius: 8, alignItems: 'center' },
    saveText: { color: 'white', fontWeight: 'bold' },
});
