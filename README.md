# AG Grid Enterprise POC - Grouped Cameras

Hierarchical AG Grid implementation with Vue 3 + TypeScript, featuring Location → Bridge → Camera grouping with server-side row model.

## Features

✅ **Hierarchical Grouping** - Location → Bridge → Camera with 5000+ cameras
✅ **Server-Side Row Model** - Infinite scrolling with lazy loading
✅ **Dynamic Grouping** - Switch between 3 grouping modes on the fly
✅ **Status Filtering** - Filter cameras and bridges by online/offline/error
✅ **Auto-Refresh** - Automatic data refresh every 30 seconds
✅ **Debug Controls** - Buttons to mutate data and test refresh
✅ **Sorting** - Sort by status with custom comparator
✅ **Virtual Scrolling** - Optimized performance for large datasets

## Tech Stack

- **Node.js** 22
- **Vite** 7
- **Vue** 3
- **AG Grid Enterprise** 34
- **TypeScript** 5

## Project Structure

```
ag-grid-POC/
├── mock-server/          # TypeScript mock API
│   └── src/
│       ├── data/         # Runtime data generation & store
│       ├── shared/core/  # Types, pagination, utils
│       ├── camera.ts     # Camera API
│       ├── location.ts   # Location API
│       ├── bridge.ts     # Bridge API
│       └── index.ts      # Exports
└── web/                  # Vue 3 frontend
    └── grouped-cameras/
        └── src/
            ├── components/    # Vue components
            ├── composables/   # Vue composables
            ├── App.vue
            └── main.ts
```

## Getting Started

### Installation

```bash
npm install
```

This will install dependencies for both the mock server and web frontend using npm workspaces.

### Running the Application

#### Option 1: Run Both (Recommended)

```bash
npm run dev
```

This starts both the mock server and Vite dev server in parallel.

#### Option 2: Run Separately

Terminal 1 - Mock Server:
```bash
npm run dev:server
```

Terminal 2 - Frontend:
```bash
npm run dev:web
```

### Access the Application

Open your browser to: **http://localhost:5173**

## Mock Server

### Data Generation

The mock server generates data at runtime:
- **100 locations** - "Location-1" through "Location-100"
- **500 bridges** - 5 per location, "Bridge-1" through "Bridge-500"
- **5000 cameras** - 10 per bridge, "Camera-1" through "Camera-5000"

Status distribution: 70% online, 20% offline, 10% error

### API Methods

All methods simulate 500ms network latency.

**Locations:**
```typescript
getLocations({ id__in?, pageToken?, pageSize? })
getLocationById(id)
```

**Bridges:**
```typescript
getBridges({ id__in?, locationId?, status__in?, pageToken?, pageSize? })
updateBridgeStatus(id, status)
getBridgeById(id)
```

**Cameras:**
```typescript
getCameras({ locationId?, bridgeId?, status__in?, id__in?, pageToken?, pageSize? })
updateCameraStatus(id, status)
getCameraById(id)
```

## Frontend Features

### Grouping Modes

1. **Location → Bridge → Camera** (default)
   - 3-level hierarchy
   - All data visible in tree structure

2. **Location → Camera**
   - 2-level hierarchy (skip Bridge level)
   - Bridge ID shown in column

3. **Bridge → Camera**
   - 2-level hierarchy (skip Location level)
   - Location ID shown in column

### Debug Controls

- **Set Bridge-1 Offline/Online** - Test bridge status mutation
- **Set Camera-1 Offline/Online** - Test camera status mutation
- **Refresh Data** - Manual refresh trigger
- **Grouping Mode Buttons** - Switch between hierarchical modes

### Filtering

Use the Status column filter to filter by:
- Online
- Offline
- Error

Filters apply to both cameras and bridges.

### Auto-Refresh

The grid automatically refreshes visible data every 30 seconds. This ensures you see the latest status changes from the mock server.

## AG Grid Configuration

### Modules Used

- `ServerSideRowModelModule` - Server-side row model
- `RowGroupingModule` - Hierarchical grouping (Enterprise)
- `SetFilterModule` - Status filtering (Enterprise)
- `MenuModule` - Column menus

### Grid Options

```typescript
{
  rowModelType: 'serverSide',
  cacheBlockSize: 100,
  maxBlocksInCache: 10,
  groupDefaultExpanded: 0,  // Collapse all by default
  autoGroupColumnDef: {
    headerName: 'Groups',
    minWidth: 300
  }
}
```

## Key Implementation Details

### GroupKeys Logic

The datasource interprets `groupKeys` to determine what data to load:

```typescript
groupKeys: []                          → Load Locations
groupKeys: ['Location-5']              → Load Bridges for Location-5
groupKeys: ['Location-5', 'Bridge-23'] → Load Cameras for Bridge-23
```

### Row Data Format

```typescript
// Group rows MUST have group: true
{ id: 'Location-1', group: true }

// Leaf rows MUST NOT have group property
{ id: 'Camera-1', locationId: 'Location-1', bridgeId: 'Bridge-5', status: 'online' }
```

## Development

### Build

```bash
npm run build
```

Builds both mock server and web frontend.

### Clean

```bash
npm run clean
```

Removes all `node_modules` and build artifacts.

## Testing Checklist

- [x] Infinite scrolling loads more data on scroll
- [x] Expand/collapse works for all levels
- [x] Status filter applies to cameras and bridges
- [x] Grouping mode changes work correctly
- [x] Debug buttons change status and refresh grid
- [x] Auto-refresh updates visible rows every 30s
- [x] Performance is smooth with 5000+ cameras
- [x] Sorting by status works correctly

## License

This is a proof-of-concept project for evaluation purposes.

## AG Grid Enterprise License

⚠️ **Note**: AG Grid Enterprise requires a valid license for production use. This POC uses AG Grid Enterprise features. For evaluation, AG Grid provides a trial license. For production deployment, please obtain a license from [AG Grid](https://www.ag-grid.com/license-pricing/).

To add your license key, edit `web/grouped-cameras/src/main.ts`:

```typescript
import { LicenseManager } from 'ag-grid-enterprise';
LicenseManager.setLicenseKey('YOUR_LICENSE_KEY');
```
