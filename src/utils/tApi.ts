import axios from 'axios';

const headers: any = {
  'Content-Type': 'application/json',
};

if (typeof window !== 'undefined') {
  headers['Cookie'] = `_tLogin=${localStorage.getItem('_tLogin')}`;
}

const api = axios.create({
  baseURL: 'https://api.travellings.cn',
  timeout: 5000,
  headers: headers,
});

export default api;