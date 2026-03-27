# AgriMicro IQ – API Specification

## Health Check
- **GET** `/health` → `{ "status": "OK" }`

## Authentication
- All protected routes require `Authorization: Bearer <Firebase_ID_Token>` header.

## Database Tables
users(firebase_uid, email, role)
farms(user_id, farm_name, crop_type, geo_polygon)
micro_zones(farm_id, zone_polygon, ndvi_value)
pest_predictions(zone_id, risk_level, probability, predicted_pest)
## API Endpoints

### Auth
- **POST** `/api/auth/sync` — Sync Firebase user to Supabase users table (requires Bearer token)

### Farms
- **POST** `/api/farms` — Create a new farm (requires Bearer token)
- **GET** `/api/farms` — Retrieve authenticated user's farms (requires Bearer token)

### Satellite & NDVI Analytics
- **POST** `/api/satellite/ndvi` — Extract 10m Sentinel Hub Data and instantiate `micro_zones` natively

### Agronomics & Core Intelligence
- **POST** `/api/weather/fetch` — Gather OpenWeatherMap micro-climate strings iteratively
- **POST** `/api/pest/predict` — Proxies FastAPI `pest_model.pkl` Random Forest execution evaluating Pest probabilities
- **POST** `/api/resource/optimize` — Derive structural thresholds returning dynamic Liters/Kg requirements
- **POST** `/api/yield/simulate` — Evaluate `yield_model.pkl` Linear Regression predicting Output Tonnage & INR Margin

### Advanced Planning & Macro Simulations
- **POST** `/api/actions/generate` — Evaluate Action Plans projecting scaled severity bounds mapping Color-Coded React Badges
- **POST** `/api/demo/stress` — Synthetic test generation injecting high-stress `0.15` NDVI mappings & Catastrophic pest vectors
- **POST** `/api/federated/aggregate` — Model aggregation logic averaging Probability nodes updating Database versions
- **GET** `/api/history/:farmId` — Historical aggregation extracting `chart.js` rendering payloads representing timeline trends
- **GET** `/api/admin/metrics` — Global Platform health-check auditing total active Farms/Zones/Simulations natively
