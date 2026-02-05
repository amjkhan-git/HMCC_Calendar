# HMCC Ramadan Iftar Sponsorship Calendar 2026

A web application for managing Ramadan Iftar sponsorships at **Heathrow Muslim Community Center (HMCC)**.

## Features

- 📅 Interactive calendar showing Ramadan 2026 dates (Feb 19 - Mar 19)
- 🌙 Hijri date display with special night highlighting (Laylatul Qadr)
- 💰 Flat pricing for all days
- 👤 Sponsor booking with approval workflow
- 💳 Payment tracking (Zelle)
- 🔐 Admin panel for managing bookings
- 📊 Export to CSV, Excel, PDF
- 📱 Mobile-responsive design

## Pricing Structure

| Period | Price | Food | Cleanup | Capacity |
|--------|-------|------|---------|----------|
| All Days | $1,500 | $1,400 | $100 | ~100 guests |

**Estimated cost includes:** Food, Dates, Water and paper products

## Payment Methods

- **Zelle (Preferred)**: Hmccoppexp@yahoo.com
- **Check / Cash**: Contact the mosque directly

## Contact for Sponsorship

- **Br. Mazar**: (202) 630-9790
- **Br. Jamal**: (407) 216-9252
- **Br. Saif**: (813) 317-6363
- **Br. Khan**: (850) 345-1751

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: Turso (SQLite Cloud)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Render.com

## Local Development

### Prerequisites

- Node.js 20.x
- Turso CLI (for database)

### Setup

1. Clone the repository:
   ```bash
   cd HMCC_Project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Turso Database
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   
   # JWT Secret (generate a strong random string)
   JWT_SECRET=your-jwt-secret-key
   
   # Admin Credentials
   ADMIN_USERNAME=hmcc_admin
   ADMIN_PASSWORD=your-secure-password
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
4. Deploy!

The `render.yaml` file is pre-configured for deployment.

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/calendar` | Get all dates with status |
| GET | `/api/v1/calendar/stats` | Get booking statistics |
| GET | `/api/v1/calendar/date/:date` | Get single date details |
| POST | `/api/v1/bookings/date/:date` | Submit new booking |

### Admin (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/login` | Admin login |
| GET | `/api/v1/admin/me` | Check auth status |
| GET | `/api/v1/admin/bookings` | Get all bookings |
| PUT | `/api/v1/admin/bookings/:id` | Update booking |
| DELETE | `/api/v1/admin/bookings/:id` | Cancel booking |
| POST | `/api/v1/admin/bookings/:id/approve` | Approve booking |
| POST | `/api/v1/admin/bookings/:id/reject` | Reject booking |
| GET | `/api/v1/admin/export/:format` | Export (csv/excel/pdf) |

## Contact

**Heathrow Muslim Community Center (HMCC)**
- 📍 1325 S International Pkwy, #1241 Lake Mary, FL-32746
- 📞 (321) 415-2675
- 🌐 https://www.heathrowmcc.org
- ✉️ info@heathrowmcc.org

---

*Designed & Developed by [Amjad Khan](mailto:amjkhan011@gmail.com)*
