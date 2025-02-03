import dotenv from 'dotenv';
import { ApiClient, fromCatalog } from "@opendatasoft/api-client";
import axios from 'axios';
import { Login, Record, ApiResponse, LocationFormData, LoginResponse } from './types';

dotenv.config();
const serverURL = process.env.SERVER_URL || 'http://localhost:3001';
axios.defaults.baseURL = serverURL;
console.log('Server URL:', serverURL);

if (!process.env.USERNAME || !process.env.PASSWORD) {
  console.error('USERNAME and PASSWORD environment variables must be set');
  process.exit(1);
}

const loginData: Login = {
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
}

axios.post(`/api/auth/login`, loginData)
  .then((response: LoginResponse) => {
    console.log('Token:', response.data);
    axios.defaults.headers.common['Authorization'] = response.data;
    console.log('Login Successful');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });

const client = new ApiClient({ domain: "documentation-resources" });

const query = fromCatalog()
  .dataset("geonames-all-cities-with-a-population-1000")
  .records()
  .select('name, population, cou_name_en, coordinates')
  .where("country_code:'DE'")
  .orderBy("-population")
  .limit(1)
  .toString();

client.get(query)
  .then((response: unknown) => {
    (response as ApiResponse).results.forEach(async record => {
      console.log(record);
      const locationData: LocationFormData = {
        title: record.name,
        xCoordinate: record.coordinates.lat.toString(),
        yCoordinate: record.coordinates.lon.toString(),
        zoom: "12",
        access: 0,
        relations: "[]",
      };
      console.log(locationData);
      await createLocation(locationData);
    });
  })
  .catch((error: unknown) => console.error(error));

async function createLocation(formData: LocationFormData) {
  try {
    const response = await axios.post('http://localhost:3000/api/location', formData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
}
