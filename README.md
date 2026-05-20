# Contributors

This project was collaboratively developed by:

- Adarsh Rana
- Abindas P

---

# LearnTrace

A comprehensive personal learning history and institutional tracking platform designed to log learning activities, analyze domains and skill patterns, automatically extract certificate credentials using AI, and manage institutional workflows like VAC refund requests.

---

##  Key Features

- **Multi-Role Authentication**  
  JWT-based secure authentication with OTP email verification (via SendGrid). Distinct roles supported:
  - Student
  - Teacher
  - HOD
  - Admin
  - VAC Incharge

- **AI-Powered Certificate Extraction**  
  Upload a certificate image and let the Groq Vision AI model automatically extract and populate:
  - Course title
  - Domain
  - Description
  - Skills
  - Deep reflection

- **VAC Refund Management**  
  Dedicated institutional workflow for handling VAC refund requests with secure multi-document handling:
  - Pre-Approval
  - Certificate
  - Receipt
  - Administrative tracking

- **Advanced Cloud Media**  
  Reliable image and PDF document storage powered by Cloudinary.

- **Dynamic Dashboards**  
  User-specific dashboards equipped with:
  - Progress statistics
  - Total entries
  - Learning hours
  - Streaks
  - Skills analytics
  - Immersive 3D visual monitoring

- **Comprehensive Timeline & Sharing**  
  Explore learning entries chronologically, copy direct share links, and export timelines as PDFs.

- **Robust Analytics**  
  Insights into:
  - Domain distribution
  - Yearly trends
  - Platform usage
  - Skills frequency

- **Personalized Profiles & Data Export**  
  Role-based profiles with support for exporting complete learning history as:
  - JSON
  - CSV

---

##  Prerequisites

Before you begin, ensure the following are installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Cloudinary Account**
- **Groq Account**
- **SendGrid Account**

---

#  Setup Instructions

##  Clone Repository

```bash
git clone https://github.com/your-username/LearnTrace.git
cd LearnTrace
```

---

## Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd ../frontend
npm install
```

---

## Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE learntrace;
```

---

##  Configure Environment Variables

Move to backend directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` file:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/learntrace?schema=public"

# JWT
JWT_SECRET="your-secret-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Groq AI
GROQ_API_KEY="..."

# SendGrid
SENDGRID_API_KEY="..."
EMAIL_FROM="your-email@example.com"
```

---

##  Prisma Setup

```bash
npx prisma generate
npx prisma migrate dev
```

---

#  Running the Application

## Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Backend runs on:

```text
http://localhost:3001
```

---

## Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

#  Access Application

Open browser and visit:

```text
http://localhost:5173
```

---

# 📁 Project Structure

```text
learntrace/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── lib/
│   │   └── index.ts
│   ├── prisma/
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── contexts/
    │   ├── utils/
    │   ├── App.tsx
    │   └── main.css
    └── package.json
```

---

# Main API Endpoints

## Authentication & Users

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/signup` | Register user |
| POST | `/api/v1/auth/verify-email` | Verify OTP |
| POST | `/api/v1/auth/login` | Login user |
| GET | `/api/v1/users/profile` | Fetch user profile |

---

## Learning Entries

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/entries` | Create entry |
| POST | `/api/v1/entries/extract-certificate` | AI extraction |
| GET | `/api/v1/entries` | Fetch entries |

---

## VAC Refund Flow

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/vac-refund` | Upload VAC documents |
| GET | `/api/v1/vac-refund` | Fetch refund status |

---

#  Design System

The platform uses a modern and interactive UI system featuring:

- Tailwind CSS
- Glassmorphism components
- Responsive layouts
- Lucide React icons
- Interactive dashboard visualizations
- 3D UI integrations

### Primary Accent Colors

- `#4A90E2`
- `#d97706`

### Typography

- Inter
- Sans-serif

---

# General Notes

- All media uploads are securely stored on Cloudinary.
- Raw PDF files are stored using:
  ```text
  resource_type: "raw"
  ```
- Local upload directories are no longer required.
- Role-based restrictions ensure users only access relevant features.

---

#  License

Built as an advanced, production-quality educational technology system.
