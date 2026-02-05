import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL (local or deployed)
// For testing on phone, use your computer's WiFi IP address
// Your IP: 192.168.194.213 (Using secondary Wi-Fi adapter)
const API_BASE_URL = 'https://moore-894m.onrender.com/api';
// const API_BASE_URL = __DEV__
//     ? 'http://192.168.194.213:5000/api'  // Matching Metro bundler IP
//     : 'https://moore-894m.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Check network connectivity
export const isOnline = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
};

// Get form schema from server
export const fetchFormSchema = async () => {
    try {
        const response = await api.get('/schema');
        return response.data;
    } catch (error) {
        console.error('Error fetching form schema:', error);
        throw error;
    }
};

// Update form schema (admin only)
export const updateFormSchema = async (elements) => {
    try {
        const token = await getAdminToken();
        const response = await api.post('/schema', { elements }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating schema:', error);
        throw error;
    }
};

// Sync members to server
export const syncMembers = async (members) => {
    try {
        const response = await api.post('/sync', { records: members });
        return response.data;
    } catch (error) {
        console.error('Error syncing members:', error);
        throw error;
    }
};

// Admin API calls (require authentication)
export const loginAdmin = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('adminToken', response.data.token);
        }
        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const getAdminToken = async () => {
    return await AsyncStorage.getItem('adminToken');
};

export const logoutAdmin = async () => {
    await AsyncStorage.removeItem('adminToken');
};

// Get all members (admin)
export const fetchAllMembers = async () => {
    try {
        const token = await getAdminToken();
        const response = await api.get('/members', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching members:', error);
        throw error;
    }
};

export const deleteMember = async (id) => {
    try {
        const token = await getAdminToken();
        const response = await api.delete(`/members/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting member:', error);
        throw error;
    }
};

export default api;
