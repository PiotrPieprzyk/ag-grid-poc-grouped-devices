// Store data in same format as datasource returns
export interface RouteData {
  rowData: any[];            // Array of row objects
  rowCount?: number;         // Total count if known
}

export interface CachedGridState {
  dataByRoute: Map<string, RouteData>; // Key: route as string, Value: row data
  expandedGroups: Set<string>;          // IDs of expanded groups
  scrollTop: number;                    // Scroll position in pixels
  timestamp: number;                    // When cached
}

export interface CacheConfig {
  maxAge?: number;           // Max age in ms (0 = no expiry)
  storageType: 'memory' | 'localStorage';
}

export class RowDataCache {
  private cache: Map<string, CachedGridState>;
  private config: CacheConfig;

  constructor(config: CacheConfig = { storageType: 'memory' }) {
    this.cache = new Map();
    this.config = config;
  }

  /**
   * Save grid state to cache
   */
  saveState(key: string, state: CachedGridState): void {
    this.cache.set(key, {
      ...state,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached state, returns null if not found or expired
   */
  getState(key: string): CachedGridState | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Validate structure
    if (!cached.dataByRoute || typeof cached.scrollTop !== 'number') {
      console.warn('[RowDataCache] Invalid cache structure, clearing');
      this.cache.delete(key);
      return null;
    }

    // Check expiry
    if (this.config.maxAge && this.config.maxAge > 0) {
      const age = Date.now() - cached.timestamp;
      if (age > this.config.maxAge) {
        this.cache.delete(key);
        return null;
      }
    }

    return cached;
  }

  /**
   * Clear specific cache entry
   */
  clearState(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Check if cache has valid entry for key
   */
  hasState(key: string): boolean {
    return this.getState(key) !== null;
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
