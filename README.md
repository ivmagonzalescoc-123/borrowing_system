# Library Book Borrowing System (Template)

Full-stack starter template with staff/student login and a basic book
borrowing workflow.

- **Backend:** Node.js + Express, MVC structure, MySQL (via XAMPP), JWT auth
- **Frontend:** Vite + React, React Router, Axios, lucide-react icons, COC (yellow & green) theme
- **Database:** MySQL, managed through XAMPP

## 🚀 Quick Start

Follow these steps in order — copy-paste each command as you go. You only
need **Node.js** and **XAMPP** installed beforehand. Nothing else to
prepare, and you do **not** need to import any database file by hand.

**1. Start MySQL.**
Open the XAMPP Control Panel and click **Start** next to **MySQL**.
(You don't need to start Apache — this app runs its own Node server.)

**2. Create your config files.** From the project's root folder, run:
NOTE! If the file has .env already for backend and front end ignore this step
```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```
This only needs to be done once. You don't need to open or edit these
files unless your MySQL has a custom root password (see the note below).

**3. Install all dependencies.** Still in the root folder, run:
```
npm run install:all
```

**4. Run the app.** Still in the root folder, run:
```
npm run dev
```
This starts the backend (`http://localhost:5000`) and the frontend
(`http://localhost:5173`) together in one terminal.

**5. Open the app.** Go to `http://localhost:5173` in your browser and log
in with a demo account:

| Role    | Email                  | Password      |
|---------|------------------------|----------------|
| Staff   | `staff@example.com`    | `password123` |
| Student | `student@example.com`  | `password123` |

That's it — everything below is extra detail for people who want to know
how it works or run things separately.

> **Note about `DB_PASSWORD`:** a fresh, unmodified XAMPP install has **no**
> MySQL root password, which is why `backend/.env.example` ships with
> `DB_PASSWORD=` left blank — most people can leave it exactly like that.
> Only edit `backend/.env` and fill in `DB_PASSWORD` if you've deliberately
> set a password on your own MySQL. This value is personal to your machine
> — never copy a teammate's.

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
  **Hand Over** a reservation here (typing in the reservation's reference
  number to confirm).
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

## Running backend/frontend separately (optional)

The Quick Start above runs everything together with `npm run dev` from the
root. If you'd rather run each one in its own terminal (useful for reading
logs separately), you can do that instead:

```
cd backend
npm install
npm run dev                 # starts on http://localhost:5000
```

```
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

Health check for the backend: `GET http://localhost:5000/api/health`

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

## Notes

- Passwords are hashed with bcrypt; never stored in plain text.
- JWT is stored in `localStorage` on the frontend and sent as a
  `Authorization: Bearer <token>` header.
- `JWT_SECRET` in `backend/.env` should be replaced with a long random
  string before any real deployment.
- This is a starting template — extend it with features like fines,
  due-date reminders, or book categories as needed.
