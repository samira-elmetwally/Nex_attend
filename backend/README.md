# Attendance Backend (Express + MySQL)

This backend follows MVC style:

- `src/routes`: API endpoints
- `src/controllers`: request/response logic
- `src/models`: database queries
- `src/middleware`: validation and error handling
- `src/config`: MySQL connection

## 1) Install dependencies

From the project root:

```bash
npm install
```

## 2) Prepare MySQL database

Use the MySQL-friendly schema file:

`backend/sql/studenthub-mysql.sql`

Example:

```bash
mysql -u root -p < backend/sql/studenthub-mysql.sql
```

## 3) Configure environment variables

Copy `backend/.env.example` to `backend/.env` and update your values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=qr_attendance_system
```

## 4) Run server

```bash
npm run dev
```

or production mode:

```bash
npm start
```

Server URL:

`http://localhost:3111`

## 5) API endpoints

### Register user
- `POST /api/auth/register`
- Body:

```json
{   
  "name": "New Student",
  "email": "newstudent@mail.com",
  "password": "123456",
  "role": "Student",
  "departmentId": 1,
  "level": 2
}
```

### Get all students
- `GET /api/students`

### Create session
- `POST /api/sessions`
- Body:

```json
{
  "courseId": 1,
  "sessionDate": "2026-05-01T10:00:00Z",
  "qrToken": "QR-NEW-001",
  "isActive": 1
}
```

### Mark attendance
- `POST /api/attendance/mark`
- Body:

```json
{
  "studentId": 1,
  "sessionId": 1,
  "status": "Present"
}
```

### Get attendance by session
- `GET /api/attendance/session/:sessionId`

Example:
- `GET /api/attendance/session/1`
