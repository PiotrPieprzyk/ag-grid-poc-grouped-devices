import { PaginatedResponse, PageToken } from './types.js';

/**
 * Encode page token to base64 string
 */
export function encodePageToken(token: PageToken): string {
  return Buffer.from(JSON.stringify(token)).toString('base64');
}

/**
 * Decode page token from base64 string
 */
export function decodePageToken(token: string): PageToken {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid page token');
  }
}

/**
 * Paginate results array
 * @param allResults - Complete filtered/sorted results
 * @param pageToken - Optional token for pagination
 * @param pageSize - Number of results per page
 * @param filters - Current filters (stored in token for verification)
 */
export function paginateResults<T>(
  allResults: T[],
  pageToken: string | undefined,
  pageSize: number = 100,
  filters: Record<string, any> = {}
): PaginatedResponse<T> {
  let offset = 0;

  // Decode page token if provided
  if (pageToken) {
    const decoded = decodePageToken(pageToken);
    offset = decoded.offset;
    // Note: In production, you'd verify filters match the token's filters
  }

  // Slice results for current page
  const results = allResults.slice(offset, offset + pageSize);
  const hasMore = offset + pageSize < allResults.length;
  const hasPrevious = offset > 0;

  return {
    results,
    nextPageToken: hasMore
      ? encodePageToken({ offset: offset + pageSize, filters })
      : undefined,
    prevPageToken: hasPrevious
      ? encodePageToken({ offset: Math.max(0, offset - pageSize), filters })
      : undefined,
    totalSize: allResults.length
  };
}
