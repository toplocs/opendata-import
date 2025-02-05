import dotenv from 'dotenv';
import { ApiClient, fromCatalog } from "@opendatasoft/api-client";
import axios from 'axios';
import { Login, Record, ApiResponse, LocationFormData, LoginResponse } from './types';

dotenv.config();
const serverURL = process.env.SERVER_URL || 'http://localhost:3000';
axios.defaults.baseURL = serverURL;
axios.defaults.family = 4; // Force IPv4
console.log('Server URL:', serverURL);

// Login and fetch Authorization Token
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


// Fetch data from opendatasoft API
const client = new ApiClient({ domain: "documentation-resources" });
const baseQuery = fromCatalog()
  .dataset("geonames-all-cities-with-a-population-1000")
  .records()
  .select('name, population, cou_name_en, coordinates')
  .where("country_code:'DE'")
  .orderBy("-population")
  .limit(2)

for (let offset = 0; offset < 100; offset += 100) {
  const query = baseQuery.offset(offset).toString();
  client.get(query)
    .then(async (response: unknown) => {
      for (const record of (response as ApiResponse).results) {
        const locationData: LocationFormData = {
          title: record.name,
          xCoordinate: record.coordinates.lat.toString(),
          yCoordinate: record.coordinates.lon.toString(),
          zoom: calculateZoom(record.population),
          access: 0,
          relations: "[]",
        };

        const locations: LocationFormData[] = await getLocationsByName(record.name);
        const foundLocation = locations.find((loc: LocationFormData) => 
          loc.title === record.name
        );
        console.log("Found: ", foundLocation)
        if (foundLocation && foundLocation.id) {
          await updateLocation(foundLocation.id, locationData);
          console.log('Updaterd Location: ', record.name, record.cou_name_en);
        } else {
          await createLocation(locationData);
          console.log('Created Location: ', record.name, record.cou_name_en);
        }
      }
    })
    .catch((error: unknown) => console.error(error));
}

async function getLocationsByName(name: string) {
  try {
    const response = await axios.get(`/api/location?title=${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
}

async function createLocation(formData: LocationFormData) {
  try {
    const response = await axios.post('/api/location', formData, {
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

async function updateLocation(id: string, formData: LocationFormData) {
  try {
    const data = {
      locationId: id, 
      ...formData
    };
    const response = await axios.put(`/api/location`, data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log("Updated: ", response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

function calculateZoom(population: number): string {
  if (population > 5000000) return "4";    // Country/Region
  if (population > 2000000) return "6";    // Large metropolitan
  if (population > 1000000) return "8";    // Metropolitan
  if (population > 500000) return "9";     // Large city
  if (population > 200000) return "10";    // City
  if (population > 100000) return "11";    // Small city
  if (population > 50000) return "12";     // Town
  if (population > 20000) return "13";     // Small town
  return "14";                             // Village/District
}

