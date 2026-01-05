interface TokenCacheEntry {
    nextPageToken?: string;
}

export class TokenCache {
    private cache: Map<string, TokenCacheEntry>;

    constructor() {
        this.cache = new Map<string, TokenCacheEntry>();
    }

    /**
     * Generate a unique cache key for a given hierarchy level and group keys
     */
    getCacheKey(level: number, groupKeys: string[]): string {
        return `level:${level}:${groupKeys.join(':')}`;
    }

    /**
     * Determine which page token to use based on navigation direction
     */
    getPageToken(cacheKey: string, startRow: number): string | undefined {
        const cached = this.cache.get(cacheKey);

        if (!cached) {
            console.log(`[Token Cache] No cached tokens for ${cacheKey}, starting fresh`);
            return undefined;
        }

        if (startRow === 0) {
            console.log(`[Token Cache] Going back to start for ${cacheKey}`);
            return undefined;
        }

        if (startRow > 0) {
            return cached.nextPageToken;
        }

        return undefined;
    }

    /**
     * Update token cache with new tokens from response
     */
    updateTokenCache(
        cacheKey: string,
        nextPageToken?: string,
    ): void {
        this.cache.set(cacheKey, {
            nextPageToken,
        });
    }
}
