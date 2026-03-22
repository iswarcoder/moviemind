# Deployment Guide

## 1. MongoDB Atlas
1. Create a free cluster in MongoDB Atlas.
2. Create a database user with a strong password.
3. Add your IP address to Network Access, or allow access from anywhere for testing.
4. Copy the connection string.
5. Replace `<username>`, `<password>`, `<cluster>`, and `<database>` in `backend/.env.example` with the real values and store it in Render as `MONGO_URI`.

Required backend env vars:
- `MONGO_URI`
- `JWT_SECRET`
- `OMDB_API_KEY`
- `GEMINI_API_KEY` if you want AI fallback
- `NODE_ENV=production`

## 2. Render backend
Use the root `render.yaml` or create a Render web service manually.

Settings:
- Service type: Web Service
- Runtime: Node
- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/health`

Environment variables:
- `NODE_ENV=production`
- `MONGO_URI=<your Atlas connection string>`
- `JWT_SECRET=<long random secret>`
- `OMDB_API_KEY=<your OMDb key>`
- `GEMINI_API_KEY=<your Gemini key>`

After deploy, copy the public Render URL.

## 3. Vercel frontend
Deploy the `frontend` folder as a Vercel project.

Settings:
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables:
- `VITE_API_URL=https://moviemind-8vo1.onrender.com`

If you want to use a different Render URL later, update this value in Vercel and redeploy.

The file `frontend/vercel.json` is already configured to rewrite SPA routes to `index.html`.

## 4. Final verification
1. Open the frontend URL.
2. Sign up or log in.
3. Check that API requests hit the Render backend.
4. Confirm `/api/health` returns `{"status":"ok"}`.
5. Test search, recommendations, favorites, and watchlist.

## Notes
- The backend uses `MONGO_URI`, not `MONGODB_URI`.
- The frontend reads `VITE_API_URL`.
- Render and Vercel deployments must be connected to your GitHub repo.
