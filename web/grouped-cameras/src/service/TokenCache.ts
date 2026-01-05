interface TokenCache {
    nextPageToken?: string;
    prevPageToken?: string;
    lastStartRow: number;
}

// Token cache keyed by hierarchy path (e.g., "level:0" or "level:2:locationId:bridgeId")
const tokenCache = new Map<string, TokenCache>();

/**
 * Generate a unique cache key for a given hierarchy level and group keys
 */
export function getCacheKey(level: number, groupKeys: string[]): string {
    return `level:${level}:${groupKeys.join(':')}`;
}

/**
 * Determine which page token to use based on navigation direction
 */
export function getPageToken(cacheKey: string, startRow: number): string | undefined {
    const cached = tokenCache.get(cacheKey);

    if (!cached) {
        // First request for this cache key
        console.log(`[Token Cache] No cached tokens for ${cacheKey}, starting fresh`);
        return undefined;
    }

    if (startRow === 0) {
        // Going back to the beginning
        console.log(`[Token Cache] Going back to start for ${cacheKey}`);
        return undefined;
    }

    if (startRow > cached.lastStartRow) {
        // Moving forward - use next token
        return cached.nextPageToken;
    } else if (startRow < cached.lastStartRow) {
        // Moving backward - use prev token
        return cached.prevPageToken;
    }

    return undefined;
}

/**
 * Update token cache with new tokens from response
 */
export function updateTokenCache(
    cacheKey: string,
    startRow: number,
    nextPageToken?: string,
    prevPageToken?: string
): void {
    tokenCache.set(cacheKey, {
        nextPageToken,
        prevPageToken,
        lastStartRow: startRow
    });
}
