# Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Database

**Option A: Using PostgreSQL (Recommended)**

1. Make sure PostgreSQL is running
2. Create the database:
```bash
psql -U postgres
CREATE DATABASE learntrace;
\q
```

**Option B: Using SQLite (For Quick Testing)**

Edit `backend/prisma/schema.prisma` and change:
```prisma
datasource db {
  provider = "sqlite"  // Change from "postgresql"
  url      = env("DATABASE_URL")
}
```

Then use this in `.env`:
```
DATABASE_URL="file:./dev.db"
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env  # If .env.example exists, or create .env manually
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/learntrace?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### 4. Initialize Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

Open your browser and go to:
```
http://localhost:5173
```

## Troubleshooting

- **Database connection error**: Check your PostgreSQL is running and credentials in `.env` are correct
- **Port already in use**: Change PORT in backend `.env` or frontend `vite.config.ts`
- **Module not found**: Run `npm install` in both backend and frontend directories
