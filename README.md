# LearnTrace

A comprehensive personal learning history and institutional tracking platform designed to log learning activities, analyze domains and skill patterns, automatically extract certificate credentials using AI, and manage institutional workflows like VAC refund requests.

## 🚀 Key Features

- **Multi-Role Authentication**: JWT-based secure authentication with OTP email verification (via SendGrid). Distinct roles supported: Student, Teacher, HOD, Admin, and VAC Incharge.
- **AI-Powered Certificate Extraction**: Upload a certificate image and let the Groq Vision AI model automatically extract and populate the course title, domain, description, skills, and deep reflection.
- **VAC Refund Management**: Dedicated institutional workflow for handling VAC refund requests, complete with secure multi-document handling (Pre-Approval, Certificate, Receipt) and administrative tracking.
- **Advanced Cloud Media**: Highly reliable image and PDF document storage powered by Cloudinary.
- **Dynamic Dashboards**: User-specific dashboards equipped with progress statistics (total entries, hours, streak, skills) and immersive 3D Canvas visual models for progress monitoring (for staff/admin roles).
- **Comprehensive Timeline & Timeline Share**: Explore entries chronologically, quickly copy direct share links, or download them as PDFs.
- **Robust Analytics**: Deep insights into domain distribution, yearly trends, platform usage, and skills frequency.
- **Personalized Profiles & Data Export**: Tailored profiles based on your institutional role, with support for exporting your complete history as JSON or CSV.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Cloudinary** account (for media storage)
- **Groq** account (for AI Vision auto-extraction)
- **SendGrid** account (for email verification)

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

### 2. Database & Environment Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE learntrace;
```

2. Configure environment variables for the backend:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your API keys and database credentials:

```env
# Server & Client
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/learntrace?schema=public"

# Auth
JWT_SECRET="your-super-secret-jwt-key"

# Integrations
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
GROQ_API_KEY="..."
SENDGRID_API_KEY="..."
EMAIL_FROM="your-verified-sender@example.com"
```

3. Run Prisma migrations:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 3. Run the Application

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

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📁 Project Structure

```
learntrace/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers for auth, entries, AI, analytics
│   │   ├── services/       # Business logic operations
│   │   ├── middleware/     # JWT Auth, Role validation, Error handling
│   │   ├── utils/          # Utilities (Cloudinary uploads, Emailers)
│   │   ├── lib/            # Prisma client instance
│   │   └── index.ts        # Express server setup
│   ├── prisma/             # Prisma Schema
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Reusable components (3D elements, layouts)
    │   ├── pages/          # Interactive pages tailored per role
    │   ├── contexts/       # React contexts (Auth State)
    │   ├── utils/          # API interfaces and string formatters
    │   ├── App.tsx         # Main entry point & Protected Routing
    │   └── main.css        # Tailwind config styles
    └── package.json
```

## 🔑 Main API Endpoints

### Authentication & Users
- `POST /api/v1/auth/signup` - Register a user (triggers OTP)
- `POST /api/v1/auth/verify-email` - Verify email with OTP
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/users/profile` - Standard user profiles and dashboards

### Learning Entries & Extraction
- `POST /api/v1/entries` - Create an entry with Cloudinary upload
- `POST /api/v1/entries/extract-certificate` - Groq Vision auto-extraction AI
- `GET /api/v1/entries` - Fetch filtered entries

### VAC Refund Flow
- `POST /api/v1/vac-refund` - Upload multiple VAC documents for refund analysis
- `GET /api/v1/vac-refund` - Retrieve refund statuses (by role context)

## 🎨 Design System

The application relies heavily on dynamic and modern UI components:
- **Primary Accents**: High contrast, highly legible interactive colors (#4A90E2, #d97706)
- **Glassmorphism & Shadows**: Interactive cards and timeline nodes to reflect progression.
- **Typography**: Inter / Sans-serif for all UI elements.
- Uses **Tailwind CSS** heavily for flexible alignment and responsive bounds.
- Incorporates dynamic **Lucide React** icon usage.

## 📝 General Notes

- All document and image media automatically upload to Cloudinary. Raw files (PDFs) are stored safely as `resource_type: "raw"`. 
- Local uploads directories are no longer required as they have been migrated completely to cloud integrations.
- Role management prevents Teachers and Admins from viewing irrelevant student features such as personal streak timelines.

## 📄 License

Built as an advanced, production-quality educational technology system.
