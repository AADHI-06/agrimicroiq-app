# AgriMicro IQ – System Overview

## Architecture
- **Frontend:** React + Tailwind CSS + Leaflet (hosted on Firebase Hosting)
- **Backend:** Node.js (Express) via Firebase Cloud Functions
- **Database:** Supabase PostgreSQL
- **Authentication:** Firebase Authentication
- **ML Service:** FastAPI (hosted on Render)
- **External APIs:** Sentinel Hub Process API, OpenWeatherMap API

### Database Tables Created
- users
- farms
- logs
- micro_zones
- pest_predictions table added.
- resource_recommendations
- yield_simulations
- action_plans
- federated_params

## Machine Learning Models
- **Pest Prediction Model (`pest_model.pkl`)**
  - Algorithm: `RandomForestClassifier`
  - Input Features: `NDVI`, `Temperature`, `Humidity`, `Rainfall`, `CropType`
  - Output: `RiskLevel` (High, Medium, Low), `Probability %`, `Predicted Pest Segment`
- **Yield Simulation Model (`yield_model.pkl`)**
  - Algorithm: `LinearRegression`
  - Input Features: `NDVI`, `Water`, `Fertilizer`, `Temperature`
  - Output: `Expected Yield Tonnage`, `Expected Projected Profit (INR)`
