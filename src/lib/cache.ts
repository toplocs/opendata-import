// Caching API requests
export interface CacheEntry {
  id: string;
  type: string;
}

export let cache: { [name: string]: CacheEntry } = {};
