import axios from 'axios';
import { Interest } from './types';
import { cache } from './cache';

export async function createInterest(title: string): Promise<Interest> {
  try {
    let response = await axios.get(`/api/interest?title=${encodeURIComponent(title)}`);
    
    if (response.data.length > 0) {
      console.log(`Found Interest: ${title}`);
      cache[response.data[0].title] = {
        id: response.data[0].id,
        type: "interest",
      }
      return response.data[0];
    }

    response = await axios.post('/api/interest', {
      title: title,
      access: 0,
      relations: "[]",
    });
    
    cache[response.data.title] = {
      id: response.data.id,
      type: "interest",
    }
    console.log(`Created Interest: ${title}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating interest ${title}:`, error);
    throw error;
  }
}