# Library Book Borrowing System

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
>NOTE! If the file has .env already for backend and front end ignore this step
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
in with a demo account (new staff accounts are created from **Students →
Add Staff Account**):

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

**Student portal**

- **Dashboard** (home after login): status cards (books on loan, awaiting
  pickup, next due date, borrowing slots used), plus short lists of current
  loans and pickups.
- **Book References Catalog**: a searchable, sortable book grid (two
  columns on phones). Opening a book shows its details with **Bookmark** and
  **Reserve** buttons. If the student can't reserve (overdue book, limit
  reached, already reserved), the reason is shown up front. When every copy
  is out, **Notify me when available** puts them on the book's waitlist.
- **Reservations**: reservations awaiting pickup (with the pickup deadline),
  each with a **Cancel** button, plus a **Past** tab for cancelled, declined
  and expired ones.
- **Borrowed Books**: current loans with due date and days left (overdue
  ones highlighted in red), a **Renew** button, and a **History** tab.
- **Bookmarks**: saved books, stored on the server so they follow the
  student across devices.

**Staff portal**

- **Dashboard**: desk lookup (search by reference no., student, or book),
  counts for awaiting pickup / on loan / overdue / due today, a "Needs
  attention" list, and recent activity.
- **Book References Catalog**: add and edit books, and archive books
  instead of deleting them (**Archived** next to **Add Book** lists them,
  with **Restore**). Cards show how many copies are on loan or reserved.
  Every action (add, save, archive, hand over, decline, return, ...) asks
  for confirmation first.
- **Reservations**: searchable list sorted by pickup deadline. **Hand Over**
  (confirm the reference number and set the due date) or **Decline** (with
  a reason that is sent to the student).
- **Borrowed Books**: **On loan / Overdue / Returned** tabs, search,
  **Mark Returned**, and **Export CSV** for reports.
- **Students**: every student with what they currently have out (overdue
  first). Click one to see all their records. **Add Staff Account** lives
  here, because public sign-up only creates student accounts.

## Borrowing workflow

There are no fines (these are school-owned reference books). Limits,
reminders and the overdue block are what keep books circulating.

```
reserved --hand over--> borrowed --return--> returned
   |                       (overdue = borrowed and past its due date)
   +-- student cancels --> cancelled
   +-- staff declines ---> rejected
   +-- not picked up ----> expired
```

1. **Reserved**: the student reserves online and a copy is held. They must
   pick it up by the *pickup deadline* (requested start date +
   `RESERVATION_HOLD_DAYS`) or the reservation expires and the copy is
   released.
2. **Borrowed**: staff hand the book over. The due date defaults to the
   student's requested return date (capped at `MAX_LOAN_DAYS`) and can be
   changed at the desk. Students may renew a loan `MAX_RENEWALS` time(s),
   unless it's overdue or others are on the waitlist.
3. **Returned**: staff receive the book back and the copy is available
   again. Everyone on that book's waitlist is notified.

Borrowing rules, all overridable in `backend/.env`:

| Variable                | Default | Meaning |
|-------------------------|---------|---------|
| `RESERVATION_HOLD_DAYS` | 2       | Days after the requested start date that a copy is held for pickup |
| `MAX_ADVANCE_DAYS`      | 30      | How far ahead a student may reserve |
| `DEFAULT_LOAN_DAYS`     | 7       | Loan length when the requested return date has already passed at handover |
| `MAX_LOAN_DAYS`         | 14      | Longest loan allowed |
| `MAX_ACTIVE_ITEMS`      | 3       | Reservations + loans a student may hold at once |
| `MAX_RENEWALS`          | 1       | Self-service renewals per loan |
| `RENEWAL_DAYS`          | 7       | Days each renewal adds |

A student with an overdue book can't reserve anything else until they
return it.

**Automatic reminders.** A background sweep runs every 30 minutes, and also
just before borrow lists load. It:

- expires reservations that weren't picked up
- reminds students the day before (and the day of) a due date
- notifies the student and all staff once a loan becomes overdue

Notifications link straight to the relevant page.

## Project structure

```
Prototype/
├── backend/
│   ├── database/
│   │   └── schema.sql          # tables + seed data (auto-applied on startup)
│   ├── src/
│   │   ├── config/db.js        # MySQL connection pool + transaction helper
│   │   ├── config/migrate.js   # runs schema.sql + upgrades older databases on every start
│   │   ├── config/policy.js    # borrowing rules (loan length, limits, hold days)
│   │   ├── services/borrowSweep.js # expiry, due-soon and overdue notifications
│   │   ├── controllers/        # request handlers (auth, books, borrows, notifications)
│   │   ├── middleware/         # JWT auth, role guard, error handler
│   │   ├── models/             # SQL queries (User, Book, Borrow, Notification,
│   │   │                       #   Bookmark, Waitlist, PasswordReset)
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
    │   ├── hooks/                # useMyBorrows, useAllBorrows, useReserveFlow,
    │   │                        # useModalA11y (Esc/focus trap), useUrlParam
    │   ├── utils/                # dateFormat, bookCover, records (status labels,
    │   │                        # due text), catalog (filter/sort), csv
    │   └── pages/                # Login, Register,
    │                              # Student{Catalog,Reservations,Borrowed,Bookmarks}Page,
    │                              # Staff{Dashboard,Catalog,Reservations,Borrowed,Students}Page
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
| POST   | /api/auth/register        | public        | Create a **student** account (staff can't self-register) |
| POST   | /api/auth/staff           | staff         | Create a staff account |
| POST   | /api/auth/login           | public        | Login, returns JWT       |
| GET    | /api/auth/me              | authenticated | Current user profile     |
| POST   | /api/auth/forgot-password | public        | Generate a one-time code. Same response whether or not the email exists. Outside production the code is returned in the response (no SMTP configured) |
| POST   | /api/auth/reset-password  | public        | Reset the password with the code (5 attempts, 5-minute expiry) |
| GET    | /api/books                | authenticated | List books (archived books hidden), with copies reserved/on loan and a `waitlisted` flag for the caller |
| POST   | /api/books                | staff         | Add a book |
| PUT    | /api/books/:id            | staff         | Update a book. Total copies can't go below copies currently out |
| PATCH  | /api/books/:id/archive    | staff         | Archive a book (hidden from the catalog, history kept). Refused while copies are out. Books are never deleted |
| PATCH  | /api/books/:id/restore    | staff         | Restore an archived book to the catalog |
| GET    | /api/books/archived       | staff         | List archived books |
| GET    | /api/books/bookmarks      | student       | My bookmarked book IDs |
| PUT/DELETE | /api/books/:id/bookmark | student     | Bookmark / un-bookmark |
| PUT/DELETE | /api/books/:id/waitlist | student     | Join / leave a book's waitlist |
| GET    | /api/borrows/policy       | authenticated | Current borrowing rules |
| POST   | /api/borrows              | student       | Reserve a book (bookId, purpose, requestStartDate, requestEndDate, requestTime?, policyAgreed) |
| PATCH  | /api/borrows/:id/cancel   | student       | Cancel my pending reservation |
| PATCH  | /api/borrows/:id/renew    | student       | Renew my loan |
| PATCH  | /api/borrows/:id/handover | staff         | Hand the book over (optional `dueDate`) → `borrowed` |
| PATCH  | /api/borrows/:id/reject   | staff         | Decline a reservation (`reason` required) → `rejected` |
| PATCH  | /api/borrows/:id/return   | staff         | Mark returned → `returned` |
| GET    | /api/borrows/mine         | student       | My reservations/loans (+ policy) |
| GET    | /api/borrows              | staff         | All reservations/loans (+ policy) |
| GET    | /api/users/students       | staff         | Students with their reserved/borrowed/overdue counts |
| GET    | /api/notifications/mine   | authenticated | My notifications (each may carry an in-app `link`) |
| PATCH  | /api/notifications/mark-read | authenticated | Mark all my notifications as read |

## Notes

- Passwords are hashed with bcrypt; never stored in plain text.
- JWT is stored in `localStorage` on the frontend and sent as a
  `Authorization: Bearer <token>` header.
- `JWT_SECRET` in `backend/.env` should be replaced with a long random
  string before any real deployment.
- Reserving, handing over, returning, cancelling and declining each run in
  a database transaction with row locks. Two students can't both get the
  last copy, and two staff clicking at once can't double-apply an action.
