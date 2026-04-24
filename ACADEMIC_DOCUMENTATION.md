# LearnTrace - Academic Project Documentation

## Project Overview

**LearnTrace** is an advanced full-stack web platform designed to track personal learning history, automate credential parsing using Artificial Intelligence, and handle institutional workflows for students, instructors, and administrators. 

**Domain**: Education Technology (EdTech) / Institutional Resource Management  
**Problem Statement**: Students need a centralized system to track their learning journey and request refunds efficiently, while educational staff require data-driven tools to analyze student progress. Furthermore, manual entry of certificate credentials is time-consuming and prone to human error.

## Technical Architecture

### Backend Architecture

#### Technology Stack
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL (relational database)
- **ORM**: Prisma (type-safe database queries)
- **Authentication**: JWT validation, BCrypt password hashing, and SendGrid OTP email verification.
- **AI Processing**: Groq Vision API (Llama 4 models) for OCR and text reasoning
- **Cloud Media**: Cloudinary SDK for immutable remote blob storage
- **Language**: TypeScript

#### Key Components

**1. Multi-Tier Authentication System**
- Validates user input, limits duplicates, and handles OTP transmission via email before authorizing users.
- Issues time-bounded JWT tokens identifying both identity and system Access Control Roles (Student, Teacher, HOD, Admin, VAC Incharge).

**2. Institutional Entry & Refund Administration**
- Fully handles learning entry metadata processing and strict document validation.
- Routes VAC (Value Added Course) refund requests requiring 3 distinct proofs of legitimacy (`document`, `preApproval`, `receipt`), safely uploading them to Cloudinary's raw tier.
- Permissions limit mutation of records depending explicitly on role validation.

**3. AI-Driven Automation**
- Provides high-level endpoints for `extractCertificate`, dynamically pushing certificate blobs to an AI agent which returns structured JSON payloads outlining title, target tech stack, reflection, and skills.

### Frontend Architecture

#### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Networking**: Axios

#### Key Features

**1. Role-Adaptive Interface**
- Dynamic layouts morph based on role context. Students see interactive streak-based profiles, while Teachers/Admins are shown analytical dashboards, removing personal vanity metrics.

**2. 3D Dashboards**
- Utilizes external web components combined with React to render progressive 3D classrooms/visual models representing institutional progress and holistic analytics for staff.

**3. Frictionless Form Filling**
- Through AI image extraction, "Add Entry" interfaces are seamlessly populated without user keyboard interaction upon certificate drop, heavily decreasing workflow latency.

**4. Data Visualization**
- Timeline view with comprehensive filtering.
- Reusable "Quick Share" components enabling PDF rendering and clipboard propagation.

## Database Schema Highlights

### User Model
```prisma
model User {
  id           String          @id @default(uuid())
  firstName    String
  lastName     String
  email        String          @unique
  passwordHash String          @map("password_hash")
  role         Role            @default(STUDENT)
  isVerified   Boolean         @default(false)
  verificationCode String?
  ...
}

enum Role {
  STUDENT
  TEACHER
  HOD
  VAC_INCHARGE
  ADMIN
}
```

### LearningEntry Model
```prisma
model LearningEntry {
  id              String   @id @default(uuid())
  userId          String
  title           String
  platform        String
  domain          String
  skills          String[]
  description     String?
  reflection      String?
  certificatePath String?
  ...
}
```

### VacRequest Model
```prisma
model VacRequest {
  id                String   @id @default(uuid())
  userId            String
  courseName        String
  preApprovalPath   String
  certificatePath   String
  receiptPath       String
  status            VacStatus @default(PENDING)
  ...
}
```

## Security & Reliability Implementation

### Authentication Security
- **Email Verification**: Prevents malicious automated account generation.
- **Route Protection**: Strictly isolated React Routes depending on Context API user state. Roles strictly restrict endpoints (e.g. VAC refund fetching limits visibility directly corresponding to your tier).

### Data Storage Security
- **Cloudinary Migration**: All volatile media originally stored in `/uploads/` are now securely uploaded to robust cloud clusters.
- **Integrity Enforcement**: Explicit resource type assignment (`raw` for PDFs) resolves MIME corruption failures natively.

## Academic Alignment

### Solution Highlights
✅ **Complex Roles**: Introduces comprehensive RBAC (Role-Based Access Control) reflecting true institutional hierarchies.  
✅ **AI Integration**: Demonstrates state-of-the-art vision models practically improving UX (Automated credential parsing).  
✅ **Media Hosting**: Showcases Cloud-first asset handling, sidestepping server-side file limitations.  
✅ **Workflow Pipelines**: Implements end-to-end administration flows mimicking actual university processes (VAC refunds).  

### Demonstration Readiness
- **Complete Institutional Scope**: Walk an evaluation committee through Student interactions, transition to a Teacher evaluating overall analytics, or switch to an Administrator approving refund pipelines seamlessly.
- **Intelligent Forms**: Highlight the OCR auto-fill functionality to demonstrate immediate time savings.

## Setup Instructions

See `README.md` for comprehensive environment setup operations. Note that unlike previous iterations, local `/uploads/` folder provisioning is totally unnecessary. Valid integration keys (`GROQ`, `CLOUDINARY`, `SENDGRID`) must represent functional service instances.

---

**Project Status**: ✅ Complete and Functional  
**Ready for**: Academic Evaluation, Live Demo, Final Submission
