
Project structure:
/mock-server - Folder to store fake js api server for testing
    /src 
        /shared
            /core - core api logic
        /camera.js - domain specific logic
        /location.js - domain specific logic
        /bridge.js - domain specific logic
    /data - mock data
        /camera.js 
        /location.js
        /bridge.js
/web - Folder for frontend POCs
    /grouped-cameras - POC for grouped camera view
    /shared - shared code between POCs
        /composables - Vue composables for POCs
        /components - Vue components for POCs


Packages:
- Node.js 22
- Vite 7
- Vue 3
- Ag-grid 34 (Enterprise)
- TypeScript 5


## Mock server specifications:
The mock server is built with just typescript. Do not use any databases or backand frameworks. 
The server should export functions to get data from /data folder with additional features like filtering.
Everytime data is requested, it should simulate network latency with a delay of 500ms.
I should be able to edit data during testing, by clicking on buttons in the POC frontend. Example of button: 
    "Set Bridge-1 Offline" - this should set the status of Bridge 1 to offline in the mock server data.

Data is returned in paginated format:
```typescript
interface PaginatedResponse<T> {
    results: T[];
    nextPageToken?: string;
    prevPageToken?: string;
    totalSize: number;
}
```

### Methods:
```typescript
type getCameras = (
    params: {
        locationId?: string,
        bridgeId?: string,
        status__in?: string[],
        id__in?: string[]
        pageToken?: string,
        pageSize?: number
    }
) => Promise<PaginatedResponse<Camera>>

type getLocations = (
    params: {
        id__in?: string[]
        pageToken?: string,
        pageSize?: number
    }
) => Promise<PaginatedResponse<Location>>

type getBridges = (
    params: {
        id__in?: string[],
        locationId?: string,
        status__in?: string[],
        pageToken?: string,
        pageSize?: number
    }
) => Promise<PaginatedResponse<Bridge>>
```

Data models:
```typescript
interface Camera {
    id: string;
    locationId: string;
    bridgeId: string;
    status: 'online' | 'offline' | 'error';
}

interface Location {
    id: string;
}

interface Bridge {
    id: string;
    locationId: string;
    status: 'online' | 'offline' | 'error';
}
```

## POC Requirements:

### Grouped Cameras POC:
Utilize the Server-side Data model of Ag-grid Enterprise to display cameras grouped by location and bridge. 
Location is the top-level group, with bridges as sub-groups, and cameras as the leaf nodes.

Features:
- Expand/Collapse groups for locations and bridges.
- Infinite scrolling to load more locations, bridges, and cameras as the user scrolls.
- Filtering options to filter cameras based on their status (online, offline, error).
- Automatic refresh of visible data every 30 seconds to reflect any changes in the mock server data.
- Virtual scrolling for performance optimization with large datasets.
- Change grouping:
  - Location -> (Bridge or Camera)
  - Bridge -> Camera
- Sort by status for cameras and bridges.
- Changing visible columns:
  - Show/Hide Location column
  - Show/Hide Bridge column

Debug buttons:
- "Set Bridge-1 Offline"
- "Set Bridge-1 Online"
- "Set Camera-1 Offline"
- "Set Camera-1 Online"
- "Refresh Data" - manually trigger data refresh for visible rows

Columns:
- Groups
- Id
- Status
- LocationId (optional)
- BridgeId (optional)


