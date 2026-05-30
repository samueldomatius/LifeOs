// Central Configuration for LifeOS Backend API
// GANTI URL PROD_API_URL di bawah ini dengan URL Vercel Backend Anda setelah selesai mendeploy folder server!
const PROD_API_URL = 'https://life-os-ddgi.vercel.app'; 
const DEV_API_URL = 'http://localhost:5000';

export const API_URL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? DEV_API_URL
    : PROD_API_URL;
