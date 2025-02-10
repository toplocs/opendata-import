import dotenv from 'dotenv';
import { ApiClient, fromCatalog } from "@opendatasoft/api-client";
import axios from 'axios';

import { CountryRecord, CityRecord, LocationFormData, CityApiResponse, CountryApiResponse } from './lib/types';
import { cache } from './lib/cache';
import { authenticate } from './lib/authenticate';
import { createInterest } from './lib/interests';
import { createRelation } from './lib/relations';

dotenv.config();

const serverURL = process.env.SERVER_URL || 'http://localhost:3000';
axios.defaults.baseURL = serverURL;
axios.defaults.family = 4; // Force IPv4
console.log('Server URL:', serverURL);


async function main() {
  await authenticate();
  await createCategories();

  // Fetch data from opendatasoft API
  const client = new ApiClient({ domain: "public" });
  
  const locationData: LocationFormData = {
    title: "Europe",
    xCoordinate: "54.5260",
    yCoordinate: "15.2551",
    zoom: "2",
    access: 0,
    relations: "[]",
  };
  await createOrUpdateCountry("Europe", locationData);

  // Fetch country data
  const countryQuery = fromCatalog()
    .dataset("natural-earth-countries-1_110m")
    .records()
    .select('name, geo_point_2d, pop_est, continent')
    .where("continent:'Europe'")
    .orderBy("-pop_est")
    .limit(100)
    .toString();

  await client.get(countryQuery).then(async (response: unknown) => {
    for (const record of (response as CountryApiResponse).results) {
      const locationData: LocationFormData = {
        title: record.name,
        xCoordinate: record.geo_point_2d.lat.toString(),
        yCoordinate: record.geo_point_2d.lon.toString(),
        zoom: calculateZoom(record.pop_est),
        access: 0,
        relations: "[]",
      };

      await createOrUpdateCountry(record.name, locationData);
      await createRelation(record.name, "childOf", record.continent);
    }
  }).catch((error: unknown) => console.error(error));

  // Fetch city data
  const cityQuery = fromCatalog()
    .dataset("geonames-all-cities-with-a-population-1000")
    .records()
    .select('name, population, cou_name_en, coordinates')
    .where("country_code:'DE'")
    .orderBy("-population")
    .limit(100)
  
  for (let offset = 0; offset < 300; offset += 100) {
    const query = cityQuery.offset(offset).toString();
    await client.get(query).then(async (response: unknown) => {
      for (const record of (response as CityApiResponse).results) {
        const locationData: LocationFormData = {
          title: record.name,
          xCoordinate: record.coordinates.lat.toString(),
          yCoordinate: record.coordinates.lon.toString(),
          zoom: calculateZoom(record.population),
          access: 0,
          relations: "[]",
        };
        await createOrUpdateCity(record.name, locationData);
        await createRelation(record.name, "childOf", record.cou_name_en);
        
        delete cache[record.name];
      }
    }).catch((error: unknown) => console.error(error));
  }

  console.log('Cache: ', cache);
}

main();

async function createCategories() {
  try {
    await createInterest("Category");
    await createInterest("Country");
    await createRelation("Country", "childOf", "Category");
  } catch (error) {
    console.error('Error creating categories:', error);
    throw error;
  }
}

async function createOrUpdateCity(name: string, locationData: LocationFormData) {
  const location = await createOrUpdateLocation(name, locationData);
  cache[name] = { id: location.id, type: 'location' };
}

async function createOrUpdateCountry(name: string, locationData: LocationFormData) {
  const location = await createOrUpdateLocation(name, locationData);
  cache[name] = { id: location.id, type: 'location' };
}

async function createOrUpdateLocation(name: string, locationData: LocationFormData) {
  const locations = await getLocationsByName(name);
  const foundLocation = locations.find((loc: LocationFormData) => 
    loc.title === name
  );
  if (foundLocation && foundLocation.id) {
    console.log('- Updated Location:', name);
    return await updateLocation(foundLocation.id, locationData);
  } else {
    console.log('+ Created Location:', name);
    return await createLocation(locationData);
  }
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
    return response.data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

function calculateZoom(population: number): string {
  if (population > 5000000) return "3";    // Country/Region
  if (population > 2000000) return "6";    // Large metropolitan
  if (population > 1000000) return "8";    // Metropolitan
  if (population > 500000) return "9";     // Large city
  if (population > 200000) return "10";    // City
  if (population > 100000) return "11";    // Small city
  if (population > 50000) return "12";     // Town
  if (population > 20000) return "13";     // Small town
  return "14";                             // Village/District
}



