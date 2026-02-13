# EduTrack X – Intelligent Student Progress Monitoring System

## Project Overview
EduTrack X is a production-ready Enterprise SaaS platform for student progress monitoring. It features a scalable MERN stack architecture with Role-Based Access Control (RBAC).

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts
- **Backend**: Node.js, Express, MongoDB, JWT Auth

## Prerequisites
- Node.js (v14+)
- MongoDB Atlas URI

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
NODE_ENV=development
```

### 2. Install Dependencies
Run the following commands from the root directory:
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Seed Database
To populate the database with initial users (Admin, Teacher, Student):
```bash
cd server
node seeder.js
```
*Note: Default password for all users is `password123`*

### 4. Run the Application
You can run both servers concurrently or separately.

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```
Access the app at `http://localhost:3000`.

## Folder Structure
- **server/**: Backend API (MVC pattern)
- **client/**: Frontend React App (Vite)

## Deployment
- **Backend**: Deploy to Render or Heroku.
- **Frontend**: Deploy to Vercel or Netlify.
