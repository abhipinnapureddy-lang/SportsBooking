# Smart Campus Sports Management System

A campus sports booking and facility management application with:

- Node.js + Express backend
- MySQL database
- React + Vite frontend
- JWT authentication
- Booking and venue management
- Docker and production deployment support

## Getting started

### Backend

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and set your credentials.
3. Run server:
   ```bash
   npm run dev
   ```

### Frontend

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

### Production build

1. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Start backend in production mode:
   ```bash
   cd ..
   NODE_ENV=production npm start
   ```

### Docker

1. Build and run:
   ```bash
   docker compose up --build
   ```

## Demo accounts

- admin: `admin@smartcampus.edu` / `Password123`
- owner: `owner@smartcampus.edu` / `Password123`
- student: `student@smartcampus.edu` / `Password123`
