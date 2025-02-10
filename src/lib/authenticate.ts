import axios from 'axios';
import { Login } from './types';

export async function authenticate() {
    if (process.env.USERNAME && process.env.PASSWORD) {
      const loginData: Login = {
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
      }
    
      try {
        const response = await axios.post(`/api/auth/login`, loginData);
        console.log('Token:', response.data);
        axios.defaults.headers.common['Authorization'] = response.data;
        console.log('Login Successful');
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    } else {
      console.error('Please provide USERNAME and PASSWORD in .env file');
      process.exit(1);
    }
  }