// Data Models
export type EntityStatus = 'online' | 'offline' | 'error';

export interface Location {
  id: string;
}

export interface Bridge {
  id: string;
  locationId: string;
  status: EntityStatus;
}

export interface Camera {
  id: string;
  locationId: string;
  bridgeId: string;
  status: EntityStatus;
}

// Pagination Types
export interface PaginatedResponse<T> {
  results: T[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalSize: number;
}

export interface PageToken {
  offset: number;
  filters: Record<string, any>;
}
