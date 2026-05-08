# 🔐 Auth API

Authentication API with JWT, bcrypt, and SQLite.

## Features

- User signup with bcrypt password hashing
- Login with JWT token generation
- Protected routes with auth middleware
- Per-user notes CRUD operations
- SQLite database persistence

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js + Express | Backend API |
| SQLite3 | Database |
| JWT | Authentication |
| bcrypt | Password hashing |

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Create new user | No |
| POST | `/login` | Login & get JWT token | No |
| GET | `/me` | Get current user profile | Yes |
| GET | `/notes` | Get all my notes | Yes |
| POST | `/notes` | Create a new note | Yes |
| DELETE | `/notes/:id` | Delete a note | Yes |
| GET | `/health` | Health check | No |

## Setup Instructions

### 1. Install dependencies

```bash
npm install
2. Create environment file
bash
cp .env.example .env
3. Start the server
bash
npm start
4. Open in browser
text
http://localhost:3000
Example API Calls
Signup
bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123"}'
Login
bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123"}'
Get Notes (Protected)
bash
curl http://localhost:3000/notes \
  -H "Authorization: YOUR_JWT_TOKEN"
Create Note
bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -d '{"title":"My Note","content":"Hello World"}'
Environment Variables
Variable	Default	Description
PORT	3000	Server port
JWT_SECRET	mysecretkey	Secret for JWT tokens
Project Structure
text
auth-api/
├── server.js          # Main application
├── public/            # Static HTML files
├── auth.db            # SQLite database
├── package.json
├── README.md
└── .env.example
live Demo
https://your-app.onrender.com

Author
Diya