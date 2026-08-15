# Smart Campus Sports Management System

A free, campus-only sports management and booking system built by upgrading the existing **SportsBooking** application.

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT
- **Repository:** GitHub

> This project does not use payments, pricing, or other commercial booking features. Campus sports and equipment reservations are free.

## Features

- Student, coordinator, and administrator authentication
- Student dashboard and profile management
- Sports catalogue and ground management
- Ground and court slot booking
- Timetable-aware free-slot booking
- Double-booking prevention
- Equipment reservation and inventory management
- QR-based equipment issue and return
- Tournament registration, fixtures, results, leaderboard, and certificates
- Notifications
- AI Sports Assistant
- Reports and analytics
- Search and filters
- Responsive Tailwind UI with dark-mode support

## Project Structure

```text
SportsBooking/
├── config/              # Database/configuration helpers
├── controllers/         # Backend business logic
├── database/            # Database initialization and migrations
├── frontend/            # React + Vite application
├── middleware/          # Authentication and authorization middleware
├── routes/              # Express API routes
├── server.js            # Backend entry point
├── .env.example         # Environment variable template
└── package.json         # Backend dependencies/scripts
```

## Prerequisites

Install:

- Node.js 18+ recommended
- npm
- MySQL 8+ recommended

Docker files are included for environments that use Docker, but Docker is **not required** for local development.

## 1. Clone the repository

```bash
git clone https://github.com/abhipinnapureddy-lang/SportsBooking.git
cd SportsBooking
```

## 2. Configure the backend

Create a `.env` file in the project root from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Then set your actual MySQL credentials and JWT secrets. **Never commit `.env`.**

Example development values:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sports_booking
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

SMTP variables in `.env.example` are only needed for email-related functionality.

## 3. Install backend dependencies

From the project root:

```bash
npm install
```

## 4. Prepare MySQL

Create the database configured in `.env`:

```sql
CREATE DATABASE sports_booking;
```

Then use the project's database initialization/migration scripts as required by the current codebase.

## 5. Start the backend

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

The backend normally runs on:

```text
http://localhost:5000
```

## 6. Install and start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite normally serves the frontend at:

```text
http://localhost:5173
```

## 7. Production frontend build

```powershell
cd frontend
npm run build
```

Preview the production build locally with:

```powershell
npm run preview
```

## Security and dependency checks

Check frontend dependencies with:

```powershell
cd frontend
npm audit
```

Check the production build with:

```powershell
npm run build
```

Do not use `npm audit fix --force` blindly on this project because it can introduce major-version framework changes. Review major upgrades separately.

## Git workflow

Work on a feature branch instead of committing directly to `main`:

```bash
git checkout -b feature/<your-module>
```

Before opening a pull request:

```bash
git pull origin main
git status
git add .
git commit -m "describe the change"
git push -u origin feature/<your-module>
```

Review and test the branch before merging it into `main`.

## Testing

See [`docs/TESTING.md`](docs/TESTING.md) for the final manual acceptance checklist.

## Important rules

- Modify the existing SportsBooking project; do not recreate it from scratch.
- Keep existing APIs working whenever possible.
- Keep secrets out of Git.
- Keep campus booking free: no payment gateway and no commercial pricing.
- Use reusable components and production-quality code.
- Test before merging.
