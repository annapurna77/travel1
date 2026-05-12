# TravelApp

Full-stack travel booking app with a Vite React frontend, Express backend, and MongoDB.

## Local Development

Backend:

```sh
cd backend
npm install
npm run dev
```

Frontend:

```sh
cd frontend
npm install
npm run dev
```

Default URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Environment

Backend uses `backend/.env`; frontend uses `frontend/.env`.

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

Backend:

```env
PORT=5000
MONGO_URL=mongodb://localhost:27017/travelapp
JWT_SECRET=change-this-secret
FRONTEND_URL=http://localhost:5173
```
