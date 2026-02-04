import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL (local or deployed)
const API_BASE_URL = __DEV__
    ? 'http://localhost:5000/api'
    : 'https://your-render-app.onrender.com/api';

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

export default api;
