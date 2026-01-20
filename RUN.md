# How to Run LearnTrace

## Quick Setup Steps

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Database Setup

**A. Install PostgreSQL** (if not installed):
- Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
- macOS: `brew install postgresql`
- Or download from: https://www.postgresql.org/download/

**B. Create Database:**
```bash
# Start PostgreSQL service
sudo service postgresql start  # Linux
# or: brew services start postgresql  # macOS

# Create database
sudo -u postgres psql
CREATE DATABASE learntrace;
\q
```

**C. Create .env file:**
```bash
cd backend
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learntrace?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
ENVEOF
```

**Update DATABASE_URL** with your PostgreSQL username/password if different from `postgres/postgres`.

### 3. Initialize Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### 5. Open Application

Open browser: **http://localhost:5173**

## First Steps

1. Click "Sign up" to create an account
2. Login with your credentials
3. Click "Add Entry" to log your first learning activity
4. Explore Dashboard, Timeline, Analytics, etc.

## Troubleshooting

**Node.js version**: You have v12.22.9 - Consider upgrading to v18+ for better compatibility:
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Database connection error:**
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify credentials in `backend/.env`
- Test connection: `psql -U postgres -d learntrace`

**Port already in use:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

**Module errors:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Prisma errors:**
- Make sure database exists
- Check DATABASE_URL in `.env`
- Try: `npm run prisma:generate` again
