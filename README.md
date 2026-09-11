# Library Book Borrowing System (Template)

Full-stack starter template with staff/student login and a basic book
borrowing workflow.

- **Backend:** Node.js + Express, MVC structure, MySQL (via XAMPP), JWT auth
- **Frontend:** Vite + React, React Router, Axios, lucide-react icons, COC (yellow & green) theme
- **Database:** MySQL, managed through XAMPP / phpMyAdmin

## Layout

Each portal (student / staff) has a sidebar with three sections:

- **Product Catalog** — a clickable grid of books. Clicking a book opens a
  detail modal (cover, publisher/ISBN/date, availability, description) with
  a **Bookmark** toggle and a **Reserve** button that reveals the
  reservation form (purpose, borrow date range, time to return, policy
  agreement) in the same modal. Submitting issues a reference number and a
  printable confirmation. Staff see the same catalog for managing inventory
  (add/delete) instead of reserving.
- **Reservations** — pending requests awaiting counter pickup. Staff can
  **Hand Over** a reservation here.
- **Borrowed Books** — books currently checked out and past returns. Staff
  can **Mark Returned** here.

## Borrowing workflow

The status moves through three stages, each with its own badge color on the
COC (yellow/green) theme:

1. **Reserved** (yellow) — student submitted the reservation online; a copy is held.
2. **Borrowed** (green) — staff handed the physical book to the student ("Hand Over").
3. **Returned** (gray) — staff received the book back; the copy is available again.

A notification bell in the navbar shows reservation/hand-over/return updates
(stored server-side per user, so a student sees updates staff make from a
different device). Bookmarks are saved per-user in the browser's
localStorage.

## Project structure

```
Prototype/
├── backend/
│   ├── database/
│   │   └── schema.sql          # tables + seed data (auto-applied on startup)
│   ├── src/
│   │   ├── config/db.js        # MySQL connection pool
│   │   ├── config/migrate.js   # runs schema.sql on every server start
│   │   ├── controllers/        # request handlers (auth, books, borrows, notifications)
│   │   ├── middleware/         # JWT auth, role guard, error handler
│   │   ├── models/             # SQL queries (User, Book, Borrow, Notification)
│   │   ├── routes/             # Express routers
│   │   └── app.js              # Express app + route wiring
│   ├── server.js                # entry point (runs migrate() before listening)
│   ├── .env                     # local config (not committed)
│   └── .env.example
└── frontend/
    ├── public/assets/img/       # local book cover images (no internet needed)
    ├── src/
    │   ├── api/axios.js         # axios instance + auth header
    │   ├── context/            # AuthContext, NotificationContext, BookmarkContext, ToastContext
    │   ├── components/          # Navbar, Sidebar, ProfileMenu, NotificationBell, AppToast,
    │   │                        # BookCatalogCard, BookDetailModal, AddBookModal,
    │   │                        # BorrowRecordRow, ReservationSuccessModal, HandoverModal,
    │   │                        # ForgotPasswordModal, GoogleLoginModal, StatusBadge
    │   ├── utils/                # dateFormat, bookCover helpers
    │   └── pages/                # Login, Register,
    │                              # Student{Catalog,Reservations,Borrowed,Bookmarks}Page,
    │                              # Staff{Catalog,Reservations,Borrowed}Page
    ├── .env                      # local config (not committed)
    └── .env.example
```

## 1. Database setup (XAMPP)

1. Start **MySQL** from the XAMPP control panel (Apache isn't needed — the
   backend runs its own Node server).
2. That's it — no manual import step. The backend automatically creates the
   `library_db` database, all tables, and the seed data (two demo accounts,
   password `password123`, plus 23 sample books) the first time you run
   `npm run dev` / `npm start` in `backend/`. It re-checks on every start and
   does nothing if everything already exists, so it's always safe to run.
   - Staff: `staff@example.com`
   - Student: `student@example.com`

   (If you ever want to run it by hand instead — e.g. via phpMyAdmin's
   `Import` — the file is `backend/database/schema.sql`.)

## 2. Backend setup

```
cd backend
npm install
copy .env.example .env      # see note below before editing
npm run dev                 # starts on http://localhost:5000
```

**About `DB_PASSWORD` in `.env`:** this must match *your own* MySQL root
password, not whatever a teammate uses. A fresh, unmodified XAMPP install
has **no root password**, which is why `.env.example` ships with
`DB_PASSWORD=` (blank) — most people can leave it as-is. Only change it if
you've deliberately set a MySQL root password on your machine. Also set
`JWT_SECRET` to any random string.

Health check: `GET http://localhost:5000/api/health`

### API overview

| Method | Route                     | Access        | Description              |
|--------|---------------------------|---------------|--------------------------|
| POST   | /api/auth/register        | public        | Create staff/student account |
| POST   | /api/auth/login           | public        | Login, returns JWT       |
| GET    | /api/auth/me              | authenticated | Current user profile     |
| POST   | /api/auth/forgot-password | public        | Generate an OTP for password reset (no SMTP configured — OTP is returned in the response, not emailed) |
| POST   | /api/auth/reset-password  | public        | Reset password using the OTP |
| GET    | /api/books                | authenticated | List all books           |
| POST   | /api/books                | staff         | Add a book (title, author, isbn, category, publisher, publishedDate, description, coverUrl, totalCopies) |
| PUT    | /api/books/:id            | staff         | Update a book             |
| DELETE | /api/books/:id            | staff         | Delete a book              |
| POST   | /api/borrows              | student       | Reserve a book (bookId, purpose, requestStartDate, requestEndDate, requestTime, policyAgreed) — status → `reserved`, generates a reference number |
| PATCH  | /api/borrows/:id/handover | staff         | Hand the physical book over (status → `borrowed`), notifies the student |
| PATCH  | /api/borrows/:id/return   | staff         | Mark a book as returned (status → `returned`), notifies the student |
| GET    | /api/borrows/mine         | student       | My reservations/loans      |
| GET    | /api/borrows              | staff         | All reservations/loans     |
| GET    | /api/notifications/mine   | authenticated | My notifications           |
| POST   | /api/notifications        | authenticated | Create a notification for myself |
| PATCH  | /api/notifications/mark-read | authenticated | Mark all my notifications as read |

## 3. Frontend setup

```
cd frontend
npm install
copy .env.example .env      # VITE_API_URL should point at the backend
npm run dev                 # starts on http://localhost:5173
```

## Running both at once (optional)

From the project root you can install and run both servers together
instead of `cd`-ing into each folder. Note that plain `npm install` at the
root only installs the root's own devDependency (`concurrently`) — it does
**not** install `backend/` or `frontend/`'s dependencies. Use
`npm run install:all` for that:

```
npm run install:all         # installs root + backend + frontend dependencies
npm run dev                 # runs backend and frontend concurrently
```

## Notes

- Passwords are hashed with bcrypt; never stored in plain text.
- JWT is stored in `localStorage` on the frontend and sent as a
  `Authorization: Bearer <token>` header.
- `JWT_SECRET` in `backend/.env` should be replaced with a long random
  string before any real deployment.
- This is a starting template — extend it with features like fines,
  reservations, due-date reminders, or book categories as needed.
