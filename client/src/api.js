import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1', withCredentials: true });
export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
export default api;
