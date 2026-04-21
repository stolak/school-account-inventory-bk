# Nigeria States and LGAs API

This service provides endpoints to access Nigerian states and Local Government Areas (LGAs) data.

## Available Endpoints

### 1. Get All States

- **Endpoint**: `GET /api/v1/locations/states`
- **Description**: Returns a list of all Nigerian states
- **Response**:

```json
{
  "success": true,
  "message": "States retrieved successfully",
  "data": {
    "states": ["Abia", "Adamawa", "Akwa Ibom", ...],
    "count": 37
  }
}
```

### 2. Get All Data

- **Endpoint**: `GET /api/v1/locations/data`
- **Description**: Returns complete data with all states and their LGAs
- **Response**:

```json
{
  "success": true,
  "message": "Location data retrieved successfully",
  "data": {
    "Abia": ["Aba North", "Aba South", "Arochukwu", ...],
    "Adamawa": ["Demsa", "Fufure", "Ganye", ...],
    ...
  }
}
```

### 3. Get LGAs by State

- **Endpoint**: `GET /api/v1/locations/states/{state}/lgas`
- **Description**: Returns all LGAs for a specific state
- **Parameters**:
  - `state` (path): The name of the state
- **Example**: `GET /api/v1/locations/states/Lagos/lgas`
- **Response**:

```json
{
  "success": true,
  "message": "LGAs for Lagos retrieved successfully",
  "data": {
    "state": "Lagos",
    "lgAs": ["Agege", "Ajeromi-Ifelodun", "Alimosho", ...],
    "count": 20
  }
}
```

### 4. Get Location Metadata

- **Endpoint**: `GET /api/v1/locations/metadata`
- **Description**: Returns statistics and detailed metadata about all locations
- **Response**:

```json
{
  "success": true,
  "message": "Location metadata retrieved successfully",
  "data": {
    "totalStates": 37,
    "totalLGAs": 774,
    "states": [
      {
        "name": "Abia",
        "lgaCount": 17,
        "lgAs": ["Aba North", "Aba South", ...]
      },
      ...
    ]
  }
}
```

### 5. Search States

- **Endpoint**: `GET /api/v1/locations/search/states?q={query}`
- **Description**: Search for states by name (case-insensitive)
- **Parameters**:
  - `q` (query): Search query
- **Example**: `GET /api/v1/locations/search/states?q=lag`
- **Response**:

```json
{
  "success": true,
  "message": "States matching \"lag\" retrieved successfully",
  "data": {
    "query": "lag",
    "states": ["Lagos"],
    "count": 1
  }
}
```

### 6. Search LGAs

- **Endpoint**: `GET /api/v1/locations/search/lgas?q={query}&state={state}`
- **Description**: Search for LGAs by name (case-insensitive)
- **Parameters**:
  - `q` (query): Search query (required)
  - `state` (query): Filter by specific state (optional)
- **Example**: `GET /api/v1/locations/search/lgas?q=ikeja&state=Lagos`
- **Response**:

```json
{
  "success": true,
  "message": "LGAs matching \"ikeja\" retrieved successfully",
  "data": {
    "query": "ikeja",
    "state": "Lagos",
    "lgAs": [
      {
        "lga": "Ikeja",
        "state": "Lagos"
      }
    ],
    "count": 1
  }
}
```

## Data Source

The data is sourced from `nigeria-states-lgas.json` file which contains:

- 37 states (including FCT)
- 774 Local Government Areas
- Complete mapping of states to their LGAs

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (missing required parameters)
- `404`: Not found (state doesn't exist)
- `500`: Server error

Error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Usage Examples

### JavaScript/TypeScript

```javascript
// Get all states
const response = await fetch("/api/v1/locations/states");
const data = await response.json();
// Get LGAs for Lagos
const response = await fetch("/api/v1/locations/states/Lagos/lgas");
const data = await response.json();

// Search for states containing "rivers"
const response = await fetch("/api/v1/locations/search/states?q=rivers");
const data = await response.json();
```

### cURL

```bash
# Get all states
curl -X GET http://localhost:5000/api/v1/locations/states

# Get all data
curl -X GET http://localhost:5000/api/v1/locations/data

# Get LGAs for Lagos
curl -X GET http://localhost:5000/api/v1/locations/states/Lagos/lgas

# Search states
curl -X GET "http://localhost:5000/api/v1/locations/search/states?q=lag"

# Search LGAs
curl -X GET "http://localhost:5000/api/v1/locations/search/lgas?q=ikeja&state=Lagos"
```

## Notes

- All endpoints are public (no authentication required)
- State names are case-sensitive in path parameters
- Search queries are case-insensitive
- All responses include CORS headers for cross-origin requests
- Data is cached in memory for performance
