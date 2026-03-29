# Sports Prediction Bets

A full-stack sports prediction game built with Next.js 14 and Neon PostgreSQL.

## Features

- **Authentication**: Username + password login/register system
- **Team Management**: Create teams, assign to groups, add players
- **Match Management**: Create matches, set results, track phases
- **Predictions**: Users can make predictions on upcoming matches
- **Leaderboard**: Automatic ranking based on points
- **Admin Panel**: Full CRUD operations for teams, matches, and results
- **Minimal Premium UI**: Dark, professional interface inspired by fintech dashboards

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL
- **Authentication**: JWT tokens (HTTP-only cookies)
- **Password Hashing**: bcryptjs

## Setup Instructions

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local` and ensure `DATABASE_URL` and `JWT_SECRET` are set

3. **Create database schema:**
   - Run the SQL in `lib/db/schema.sql` in your Neon SQL editor

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the app:**
   - Visit `http://localhost:3000`
   - Register a new account or create an admin user in the database

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── teams/        # Team CRUD
│   │   ├── matches/      # Match CRUD
│   │   ├── predictions/  # Prediction endpoints
│   │   └── users/        # User endpoints
│   ├── admin/            # Admin pages
│   ├── matches/          # Match pages
│   ├── leaderboard/      # Leaderboard page
│   └── login/            # Login/Register page
├── components/           # React components
├── context/             # App context (state management)
├── lib/
│   ├── db/              # Database connection & schema
│   ├── auth.ts          # Authentication utilities
│   └── middleware.ts    # Auth middleware
├── types/               # TypeScript types
└── utils/               # Utility functions

```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Data
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team (admin)
- `PATCH /api/teams/[id]` - Update team (admin)
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create match (admin)
- `PATCH /api/matches/[id]` - Update match (admin)
- `GET /api/predictions` - Get predictions
- `POST /api/predictions` - Create prediction
- `GET /api/users` - Get all users with stats
- `POST /api/recalculate` - Recalculate points (admin)

## Scoring System

- **Exact Score**: +10 points
- **Winner Only**: +3 points
- **Man of the Match**: +3 points (bonus)
- **Wrong Prediction**: 0 points

## Database Schema

- `users` - User accounts with authentication
- `teams` - Teams participating in competition
- `players` - Players belonging to teams
- `matches` - Match fixtures and results
- `predictions` - User predictions
- `competitions` - Competition information

See `lib/db/schema.sql` for full schema.

## Development

- All mock data has been removed
- All data comes from Neon PostgreSQL database
- Authentication uses JWT tokens stored in HTTP-only cookies
- Points are automatically recalculated when match results are updated

## License

This is a school project for educational purposes.
# sitewebmalefique
