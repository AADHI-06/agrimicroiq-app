# 🔐 AgriMicro IQ - Secrets Template

To ensure the security of the platform, copy this template and create a `.env` file in the respective directories (or set them in your Cloud provider's dashboard).

> [!IMPORTANT]
> **NEVER** commit your actual `.env` file or any `serviceAccount.json` to version control.

## 🚀 Backend (`server/.env`)

```bash
# Firebase Admin (Standard Cloud Initialization)
# Copy the ENTIRE content of your serviceAccount.json as a single string here
FIREBASE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'

# Supabase Identity & Database
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# External APIs
SENTINEL_CLIENT_ID="your-id"
SENTINEL_CLIENT_SECRET="your-secret"
OPENWEATHER_API_KEY="your-key"

# Internal URLs
ML_SERVICE_URL="http://127.0.0.1:10000"
ML_SERVICE_API_KEY="your-internal-key"
```

## 🧪 ML Service (`ml-service/env`)

```bash
# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'

# API Security
ML_SERVICE_API_KEY="your-internal-key"
```

## 💻 Frontend (`client/.env`)

```bash
# Firebase Public Config
REACT_APP_FIREBASE_API_KEY="your-public-key"
REACT_APP_FIREBASE_AUTH_DOMAIN="your-domain"
REACT_APP_FIREBASE_PROJECT_ID="your-id"

# Backend API
REACT_APP_API_URL="http://localhost:5000/api"
```

---

## ☁️ Production Deployment Instructions

### 1. Firebase Functions
Use the Firebase CLI to set secrets before deploying:
```bash
firebase functions:config:set \
  secrets.firebase_json='{"type":..."}' \
  secrets.supabase_url="..."
```

### 2. Render (ML Service)
- Go to the **Dashboard** -> **ML Service** -> **Environment**.
- Add a New Environment Variable: `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Paste the content of your JSON file.

### 3. Firebase Hosting (Frontend)
- Set variables in your CI/CD pipeline (e.g., GitHub Actions Secrets) if you use automated builds.
