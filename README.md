# Crusin

A full-stack rideshare web application built with React, Node.js/Express, PostgreSQL, and Asgardeo authentication.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, React Router v7
- **Backend:** Node.js, Express v5, Sequelize ORM
- **Database:** PostgreSQL (Neon hosted)
- **Auth:** Asgardeo (OAuth 2.0 / OIDC)
- **AI:** Azure OpenAI (GPT-4o) for ride destination recommendations

---

## Project Structure

```
Crusin - Final Project/
├── frontend/         # React + Vite app
└── backend/          # Node.js + Express API
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL instance)
- An [Asgardeo](https://wso2.com/asgardeo/) account with a configured Single Page Application
- An Azure OpenAI deployment (GPT-4o)

---

### 1. Clone the repo

```bash
git clone <repo-url>
cd "Crusin - Final Project"
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5001

# PostgreSQL (Neon or local)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SCHEMA=public
PGSSLMODE=require   # remove this line if using a local non-SSL database

# Asgardeo
ASGARDEO_ORG=your-asgardeo-org-name
ASGARDEO_ISSUER=https://api.asgardeo.io/t/<your-org>/oauth2/token
ASGARDEO_CLIENT_ID=your-asgardeo-client-id

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.services.ai.azure.com/
AZURE_OPENAI_KEY=your-azure-openai-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

Start the backend:

```bash
npm run dev      # development (auto-restarts on file changes)
npm start        # production
```

The API will be available at `http://localhost:5001`.

> **Database tables** are auto-created on first start via Sequelize's `sync({ alter: true })`. To seed the database with sample data run:
> ```bash
> node seed.js
> ```

---

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
# Backend API
VITE_API_BASE_URL=http://localhost:5001

# Asgardeo
VITE_ASGARDEO_CLIENT_ID=your-asgardeo-client-id
VITE_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/<your-org>

# App URL (used for Asgardeo redirect URIs)
VITE_APP_URL=http://localhost:5173
```

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Asgardeo Configuration

In your Asgardeo console, configure your Single Page Application with:

- **Authorized redirect URLs:** `http://localhost:5173/` and your production URL
- **Allowed origins:** `http://localhost:5173` and your production URL
- **Token type:** JWT access tokens (set in the Protocol tab)
- **Scopes:** `openid`, `profile`, `email`

---

## Environment Variables Reference

### Backend

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default: 5001) |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_SCHEMA` | Database schema (default: `public`) |
| `PGSSLMODE` | Set to `require` for SSL connections (Neon requires this) |
| `ASGARDEO_ORG` | Your Asgardeo organization name |
| `ASGARDEO_ISSUER` | Asgardeo token issuer URL |
| `ASGARDEO_CLIENT_ID` | Asgardeo application client ID |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource endpoint |
| `AZURE_OPENAI_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | Azure OpenAI deployment name (e.g. `gpt-4o`) |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_ASGARDEO_CLIENT_ID` | Asgardeo application client ID |
| `VITE_ASGARDEO_BASE_URL` | Asgardeo base URL (includes org name) |
| `VITE_APP_URL` | Frontend app URL (used for Asgardeo redirect URIs) |

---

## Deployment (Render)

Both services are deployed on [Render](https://render.com).

- **Frontend:** Static site — set all `VITE_*` environment variables in the Render dashboard before building. Change `VITE_API_BASE_URL` to the backend's Render URL and `VITE_APP_URL` to the frontend's Render URL.
- **Backend:** Web service running `npm start` — set all backend environment variables in the Render dashboard.

After deploying, add the production frontend URL to your Asgardeo app's authorized redirect URLs and allowed origins.
