# Locnos - Logistics Management System

Locnos is a comprehensive logistics expedition management system designed to streamline operations such as order management, carrier tracking, vehicle scheduling, and route optimization.

## Features

- **Order Management**: Track and manage logistics orders efficiently.
- **Carrier & Vehicle Management**: Maintain a database of carriers and their fleets.
- **Route Optimization**: Plan and optimize delivery routes (Roteirização).
- **Proof of Delivery**: Digital confirmation of deliveries.
- **Dashboard**: Real-time insights into logistics operations.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via [Prisma](https://www.prisma.io/))
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: CSS Modules / Global CSS
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd locnos
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and update the values.
   ```bash
   cp .env.example .env
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Application routes and pages.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and shared logic.
- `prisma`: Database schema and migrations.
- `public`: Static assets.

## Scripts

- `dev`: Runs the development server.
- `build`: Builds the application for production.
- `start`: Starts the production server.
- `lint`: Runs ESLint checks.
