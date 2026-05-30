# WorkTrack

Attendance, Daily Work Report, Holiday, and Payroll Management System.

## Tech Stack

| Layer    | Technology                                   |
|----------|----------------------------------------------|
| Backend  | Node.js 20 + Express + TypeScript            |
| Database | MySQL 8 (via Docker)                         |
| ORM      | Prisma                                       |
| Auth     | JWT + bcrypt                                 |
| Frontend | React + TypeScript + Vite                    |

## Folder Structure

```
worktrack/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Full DB schema
│   │   └── seed.ts           # Seed data
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middlewares/      # JWT auth, role guards
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Business logic
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # Prisma client, JWT helpers
│   │   └── index.ts          # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/                 # Web app
```

## Setup Instructions

### Prerequisites

- Node.js 20+
- Docker Desktop
- npm or yarn

### 1. Clone the repo

```bash
git clone <repo-url>
cd worktrack/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start PostgreSQL via Docker

```bash
docker run --name worktrack-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=worktrack \
  -p 3306:3306 \
  -d mysql:8
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (DATABASE_URL, JWT_SECRET, PORT)
```

### 5. Run database migrations

```bash
npm run db:migrate
# When prompted, name the migration: "init"
```

### 6. Generate Prisma client

```bash
npm run db:generate
```

### 7. Seed the database

```bash
npm run db:seed
```

### 8. Start the development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## Sample Credentials

| Role       | Email                  | Password   |
|------------|------------------------|------------|
| HR Admin   | admin@worktrack.com    | Admin@123  |
| Employee   | emp@worktrack.com      | Emp@123    |

## API Endpoints

### Auth

| Method | Endpoint         | Auth     | Description                        |
|--------|------------------|----------|------------------------------------|
| POST   | /api/auth/login  | Public   | Login and receive JWT token        |
| GET    | /api/auth/me     | Required | Get logged-in user profile         |

### Health

| Method | Endpoint | Auth   | Description  |
|--------|----------|--------|--------------|
| GET    | /health  | Public | Health check |

### Login Request

```json
POST /api/auth/login
{
  "email": "admin@worktrack.com",
  "password": "Admin@123"
}
```

### Login Response

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "...",
      "email": "admin@worktrack.com",
      "role": "HR_ADMIN",
      "employee": {
        "id": "...",
        "employeeCode": "EMP001",
        "firstName": "Admin",
        "lastName": "User",
        "designation": "HR Manager",
        "department": "HR"
      }
    }
  }
}
```

### Using the JWT token

```
Authorization: Bearer <token>
```

## Database Models

- **User** — Auth credentials and role (EMPLOYEE | HR_ADMIN)
- **Department** — Organizational departments
- **Employee** — Employee profiles linked to users
- **Attendance** — Daily attendance records with approval flow
- **WorkReport** — Daily work reports with approval flow
- **Holiday** — Company holidays (paid/unpaid, all/department)
- **SalaryRule** — Per-employee salary configuration
- **Payroll** — Monthly payroll records with line items
- **PayrollItem** — Individual earnings/deductions within a payroll
- **LeaveRequest** — Leave applications with approval flow
