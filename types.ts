export interface Login {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: string;
}

export interface Record {
  name: string;
  population: number;
  cou_name_en: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface ApiResponse {
  results: Record[];
}

export interface LocationFormData {
  title: string;
  xCoordinate: string;
  yCoordinate: string;
  zoom: string;
  access?: number;
  relations?: string;
}
