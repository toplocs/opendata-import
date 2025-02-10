export interface Login {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: string;
}

export interface CityRecord {
  name: string;
  population: number;
  cou_name_en: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface CountryRecord {
  name: string;
  continent: string;
  pop_est: number;
  geo_point_2d: {
    lat: number;
    lon: number;
  };
}

export interface CityApiResponse {
  results: CityRecord[];
}

export interface CountryApiResponse {
  results: CountryRecord[];
}

export interface LocationFormData {
  id?: string;
  title: string;
  xCoordinate: string;
  yCoordinate: string;
  zoom: string;
  access?: number;
  relations?: string;
}

export interface Interest {
  id: string;
  title: string;
}