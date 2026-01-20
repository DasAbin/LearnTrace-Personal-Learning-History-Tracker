# LearnTrace

A personal learning history and analytics platform that allows users to log learning activities, visualize their learning timeline, analyze skill/domain patterns, and upload certificates.

## 🚀 Features

- **Authentication**: Secure JWT-based authentication system
- **Dashboard**: Overview with stats (total entries, hours, streak, unique skills) and recent activity
- **Learning Entries**: Add, edit, delete learning entries with certificates
- **Timeline View**: Reverse chronological list with filtering capabilities
- **Entry Details**: Full view of learning entries with certificate display
- **Badge Vault**: Gallery view of all certificates with filters
- **Analytics**: Domain distribution, yearly trends, platform usage, and skills frequency
- **Heatmap**: GitHub-style calendar heatmap showing learning activity
- **Profile & Settings**: User profile, data export (JSON/CSV), and account management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE learntrace;
```

2. Configure environment variables:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/learntrace?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

3. Run Prisma migrations:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 3. Create Uploads Directory

Ensure the uploads directory exists:

```bash
cd backend
mkdir -p uploads/certificates
```

### 4. Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3001`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

The frontend application will start on `http://localhost:5173`

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📁 Project Structure

```
epd-s1/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, error handling
│   │   ├── utils/          # Utilities (file upload)
│   │   ├── types/          # TypeScript types
│   │   ├── lib/            # Prisma client
│   │   └── index.ts        # Express server
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── uploads/
│   │   └── certificates/   # Certificate storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── utils/          # API utilities
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   └── package.json
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (protected)

### Learning Entries
- `POST /entries` - Create a new entry (protected)
- `GET /entries` - Get all entries with optional filters (protected)
- `GET /entries/:id` - Get entry by ID (protected)
- `PUT /entries/:id` - Update entry (protected)
- `DELETE /entries/:id` - Delete entry (protected)

### Analytics
- `GET /analytics/summary` - Get dashboard summary (protected)
- `GET /analytics/domain-distribution` - Get domain distribution (protected)
- `GET /analytics/yearly-trend` - Get yearly trend (protected)
- `GET /analytics/platform-usage` - Get platform usage (protected)
- `GET /analytics/skills-frequency` - Get skills frequency (protected)
- `GET /analytics/heatmap` - Get heatmap data (protected)

## 🎨 Design System

The application follows a consistent design system:

- **Primary Blue**: #4A90E2
- **Deep Blue**: #2C3E50
- **Success Green**: #27AE60
- **Soft Purple**: #9B59B6 (Analytics highlights)
- **Warm Orange**: #E67E22
- **Alert Red**: #E74C3C
- **Background**: #F8F9FA
- **Card Background**: #FFFFFF

Typography uses Inter font with defined heading sizes and body text.

## 🔒 Authentication

The application uses JWT-based authentication:
- Tokens are stored in localStorage
- Tokens expire after 7 days
- Protected routes require valid authentication
- Password hashing uses bcrypt with 10 salt rounds

## 📦 Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`

## 🧪 Development

### Database Management

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## 📝 Notes

- File uploads are stored locally in `backend/uploads/certificates/`
- Images are limited to 5MB and only image formats are accepted
- The application is mobile-responsive with a mobile-first design approach
- All dates are stored in UTC and displayed in the user's local timezone

## 🐛 Troubleshooting

### Database Connection Issues

Ensure PostgreSQL is running and the connection string in `.env` is correct.

### File Upload Issues

Ensure the `uploads/certificates` directory exists and has write permissions.

### CORS Issues

If you encounter CORS errors, check that `FRONTEND_URL` in the backend `.env` matches your frontend URL.

### Port Already in Use

Change the port in the respective `package.json` or `.env` files if ports 3001 (backend) or 5173 (frontend) are in use.

## 📄 License

This project is built as a production-quality MVP for demonstration purposes.
