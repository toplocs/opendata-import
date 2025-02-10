import axios from 'axios';
import { cache } from './cache';

function capitalizeFirstLetter(val: string): string {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export async function createRelation(name: string, relation: string, other: string) {
  try {
    const type = cache[name].type;
    const otherType = cache[other].type;

    const apiPath = '/api/v2/' + type + '/' + otherType + 's/' + cache[name].id;
    let response = await axios.get(apiPath);

    if (response.data.length > 0) {
      console.log('- Relations: ', name, relation, other);
      // cache[cache[name].id] = {
      //   id: response.data[0][`Other${capitalizeFirstLetter(cache[other].type)}`].id,
      //   type: relation,
      // }
      return response.data;
    }

    let data: { [key: string]: string } = {};
    data["key"] = relation;
    data[`other${capitalizeFirstLetter(cache[other].type)}Id`] = cache[other].id;

    response = await axios.post(apiPath, data);
    
    // cache[cache[name].id] = {
    //   id: cache[other].id,
    //   type: relation,
    // }
    console.log('+ Relation: ',  name, relation, other);
    return response.data;
  } catch (error) {
    console.error('Error creating relation: ', error);
    throw error;
  }
}