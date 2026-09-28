# Sarinya System

Sarinya System is a collaborative restaurant operations application for Sarinya Restaurant. It brings product and stock records, stock movement, order entry, sales history, and staff access management into one web app, helping the team keep day-to-day inventory and sales information together.

🔗 **Live Demo:** https://sarinya.vercel.app/

## Features

- Manage products, prices, categories, and product images.
- Track inventory in batches with quantities and expiration dates; merge additions into matching active batches.
- Record stock pull-outs with a reason and optional replacement batch.
- Enter orders against available stock. Multi-item orders deduct stock by earliest expiration date (FEFO) and are recorded as order sessions.
- Review sales records, recent orders, best sellers, and daily or monthly revenue summaries.
- Manage staff accounts, activate/deactivate users, and assign module/action permissions. Admin routes and activity logs are role restricted.
- Record activity for actions such as inventory changes, sales, authentication, and user management; authenticated users can submit feedback.
- Installable progressive web app support through the service worker registration and install prompt.

## Tech Stack

### Frontend

- React 19 with Create React App (`react-scripts`)
- React Router, Axios, and Recharts
- Tailwind CSS

### Backend and data

- Node.js with Express 5
- MongoDB with Mongoose
- JWT authentication and bcryptjs password hashing

### Development and deployment configuration

- npm workspaces are not configured; the root scripts run the backend and frontend directories with `concurrently`.
- Cloudinary direct image uploads are used by the product image upload component.
- Deployment configuration is present for a Vercel frontend (`vercel.json`) and a Fly.io backend (`backend/fly.toml`, `backend/Dockerfile`). These files describe deployment targets; they do not include deployed credentials or guarantee a live deployment.

## Architecture

The React single-page client calls the Express JSON API. In development, Create React App's proxy forwards `/api` requests to `http://localhost:5000`; in a deployed client, `REACT_APP_API_URL` can point to the API origin. Express mounts authentication, inventory, product, sales, user, activity-log, and feedback routes under `/api`. Route middleware verifies JWTs and applies role or per-module permissions. Mongoose persists users, products, inventory batches, pull-outs, sales, activity logs, and feedback in MongoDB.

The multi-item order flow uses MongoDB transactions while deducting stock and writing sale records. Use a MongoDB deployment that supports transactions (such as a replica set) for that flow.

## Project Structure

```text
.
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # API request handlers
│   ├── middleware/      # JWT authentication and permissions
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── scripts/         # Seed and database migration scripts
│   └── server.js        # Express app and API startup
├── frontend/client/
│   ├── public/          # App shell and static assets
│   └── src/             # React pages, components, API, and services
├── scripts/             # Root-level development helpers
├── package.json         # Root convenience scripts
├── vercel.json          # Frontend deployment configuration
└── README.md
```

## Prerequisites

- Node.js 20 (the backend Dockerfile uses the Node 20 image)
- npm
- A MongoDB connection string. MongoDB Atlas or a local replica-set deployment is needed for transactional multi-item orders.
- A Cloudinary cloud name and unsigned upload preset if product image uploads are required.

## Installation

From the repository root, install dependencies for each package directory:

```bash
npm ci
cd backend && npm ci
cd ../frontend/client && npm ci
```

Create the backend environment file from the checked-in template:

```bash
cd ../../backend
cp .env.example .env
```

Set at least `MONGO_URI` and `JWT_SECRET` in `backend/.env` before starting the server. See [Environment Variables](#environment-variables). The frontend runs on port `3000`; the backend defaults to port `5000`.

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`. Keep real credentials out of version control.

| Variable          | Required | Purpose                                                                                                                                                                                 |
| ----------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGO_URI`       | Yes      | MongoDB connection string used by the API.                                                                                                                                              |
| `JWT_SECRET`      | Yes      | Secret used to sign and verify JWTs. Use a long, random value.                                                                                                                          |
| `PORT`            | No       | API listening port; defaults to `5000`.                                                                                                                                                 |
| `ALLOWED_ORIGINS` | No       | Comma-separated browser origins allowed by CORS. If omitted, the API allows all origins, which is intended for local development. Configure the deployed frontend origin in production. |
| `LOG_LEVEL`       | No       | Winston log threshold; defaults to `http`.                                                                                                                                              |

### Frontend (`frontend/client/.env.local`)

These are Create React App build-time variables. Set them in `frontend/client/.env.local` for local use or in the frontend deployment environment:

| Variable                             | Required          | Purpose                                                                                                                                                |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `REACT_APP_API_URL`                  | No                | API base URL. Defaults to `/api`, which uses the local development proxy. Set to the backend API origin when the client and API are hosted separately. |
| `REACT_APP_CLOUDINARY_CLOUD_NAME`    | For image uploads | Cloudinary cloud name used to construct the image upload URL.                                                                                          |
| `REACT_APP_CLOUDINARY_UPLOAD_PRESET` | For image uploads | Cloudinary unsigned upload preset.                                                                                                                     |

Values prefixed with `REACT_APP_` are embedded in the client build and must not contain private secrets.

## Running the Project

With dependencies installed and backend variables configured, run both applications from the repository root:

```bash
npm run dev
```

The frontend is available at `http://localhost:3000` and the API at `http://localhost:5000`. The API root returns a status message; `GET /api/health` provides a health response.

To run either part separately:

```bash
npm run server
npm run client
```

The client requires the backend to be running for data-backed screens. For a public demo tunnel, `npm run demo` starts both applications and invokes the Cloudflare Tunnel helper; that helper may download the `cloudflared` binary on first use.

### Initial administrator

The backend includes `npm run seed:admin`, which creates an administrator only when no admin account exists. The seeder currently contains a fixed default credential in source code. Use it only with a development database, change the password immediately after the first login, and do not use this seeder against a production database.

## Available Scripts

### Root

| Command          | Purpose                                               |
| ---------------- | ----------------------------------------------------- |
| `npm start`      | Starts backend and frontend together.                 |
| `npm run dev`    | Starts backend and frontend together for development. |
| `npm run server` | Starts the backend with `node server.js`.             |
| `npm run client` | Starts the Create React App development server.       |
| `npm run demo`   | Starts both apps and a Cloudflare Tunnel demo helper. |

### Backend (`cd backend`)

| Command                 | Purpose                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `npm start`             | Starts the Express API.                                                                 |
| `npm run seed:admin`    | Creates the initial admin account if one does not already exist. See the warning above. |
| `npm run migrate:users` | Applies the user-role migration script.                                                 |
| `npm test`              | Not implemented; this script exits with an error.                                       |

Additional one-off database migration/seed scripts are in `backend/scripts/`. Review each script before running it against data; not all are exposed as npm scripts.

### Frontend (`cd frontend/client`)

| Command         | Purpose                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `npm start`     | Starts the local development server.                                                                 |
| `npm run build` | Creates a production build in `build/`.                                                              |
| `npm test`      | Starts the Create React App test runner in watch mode. No frontend test files are currently present. |
| `npm run eject` | Ejects Create React App configuration; this is a one-way operation.                                  |

## Development Notes

- The API registers routes under `/api/auth`, `/api/inventory`, `/api/products`, `/api/sales`, `/api/users`, `/api/activity-logs`, and `/api/feedback`.
- Admins bypass per-action permission checks; staff access is controlled by permissions on inventory, sales, and users. User-management and activity-log pages are admin-only.
- Inventory, product, sale, and user removal use soft-delete fields. Pull-out records are kept separately from inventory batches.
- Passwords are hashed with bcryptjs. The client stores the JWT and user summary in browser `localStorage`; the API checks account status and permissions on protected requests.
- The registration endpoint exists at `POST /api/auth/register` and is described in code as a one-time owner-account setup. It is not disabled by a server-side one-time guard, so do not expose it as an unrestricted public signup flow.
- Feedback submission is implemented. The admin feedback listing endpoint exists, but the route comment identifies its review page as future UI; there is no feedback management page in the current frontend.

## Contributors

This is a collaborative team project for Sarinya Restaurant. The repository does not include a reliable contributor roster, so individual contributors are not listed here.
