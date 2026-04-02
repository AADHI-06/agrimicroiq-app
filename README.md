# 🌱 AgriMicro IQ

**AgriMicro IQ** is an intelligent agricultural decision-support platform that leverages satellite data, machine learning, and geospatial analysis to optimize crop yield, predict pest risks, and provide actionable recommendations at a micro-zone level.

---

## 🚀 Features

* 🌍 **Farm Mapping** – Draw farm boundaries interactively on a map
* 🛰️ **NDVI Analysis** – Satellite-based vegetation health monitoring
* 🐛 **Pest Risk Prediction** – ML-based classification (Low / Medium / High)
* 📈 **Yield Estimation** – Predict crop yield using regression models
* 💰 **Profit Calculation** – Estimate expected profit based on inputs
* 🧠 **Smart Recommendations** – Zone-wise action plans
* 📊 **Analytics Dashboard** – Trends and performance insights
* 📄 **PDF Report Generation** – Export complete farm reports

---

## 🏗️ Architecture

Frontend (React + Tailwind)
⬇
Backend (Node.js / Firebase Functions)
⬇
ML Service (FastAPI / Python)
⬇
Database (Supabase PostgreSQL)

---

## 🧠 Machine Learning Models

* **Classification Model**

  * Algorithm: Random Forest
  * Purpose: Pest risk prediction

* **Regression Models**

  * Yield Prediction Model
  * Profit Estimation Model

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Leaflet (Map Visualization)

### Backend

* Node.js (Express)
* Firebase Cloud Functions

### ML Service

* Python (FastAPI)
* Scikit-learn

### Database

* Supabase (PostgreSQL)

### APIs

* Sentinel Hub (NDVI Data)
* OpenWeatherMap (Weather Data)

---

## 🌐 Deployment

| Service    | Platform         | URL                                         |
| ---------- | ---------------- | ------------------------------------------- |
| Frontend   | Firebase Hosting | https://agri-micro-iq.web.app               |
| Backend    | Render           | https://agrimicroiq-app.onrender.com        |
| ML Service | Render           | https://agrimicroiq-ml-service.onrender.com |

---

## ⚙️ Environment Variables

### Backend (.env)

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
FIREBASE_PROJECT_ID=your_project_id
ML_SERVICE_URL=https://agrimicroiq-ml-service.onrender.com
JWT_SECRET=your_secret

---

### ML Service (.env)

API_KEY=your_internal_api_key
MODEL_PATH=./models

---

## 🔐 Security Features

* Secure authentication (Firebase Auth)
* Environment-based secret management
* API authorization using tokens
* Input validation and sanitization
* Rate limiting for abuse prevention

---

## 📦 Installation & Setup

### 1. Clone the Repository

git clone https://github.com/AADHI-06/agrimicroiq.git
cd agrimicroiq

---

### 2. Frontend Setup

cd client
npm install
npm start

---

### 3. Backend Setup

cd server
npm install
npm run dev

---

### 4. ML Service Setup

cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload

---

## 📊 API Endpoints (Sample)

### Backend

GET /api/farms
POST /api/farms
GET /api/analytics

### ML Service

POST /predict
GET /health

---

## 🧪 Testing

* Functional Testing
* API Testing
* Integration Testing
* End-to-End Testing

---

## 👥 Contributors

* **Frontend Engineer** – UI/UX, Visualization, Integration
* **Backend & ML Engineer** – APIs, ML Models, Data Processing

---

## 📌 Future Enhancements

* Real-time IoT sensor integration
* Advanced crop recommendation system
* Mobile application support
* Multi-language support

---

## 📄 License

This project is developed for academic and research purposes.

---

## 💡 Acknowledgement

This project utilizes satellite data, machine learning techniques, and modern web technologies to build a scalable smart agriculture solution.

---

⭐ If you found this project useful, consider giving it a star!
