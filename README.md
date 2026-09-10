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

A notification bell in the navbar confirms successful reservations, and
bookmarks are saved per-user — both stored in the browser's localStorage.

## Project structure

```
Prototype/
├── backend/
│   ├── database/
│   │   └── schema.sql          # tables + seed data
│   ├── src/
│   │   ├── config/db.js        # MySQL connection pool
│   │   ├── controllers/        # request handlers (auth, books,borrows)
│   │   ├── middleware/         # JWT auth, role guard, error handler
│   │   ├── models/             # SQL queries (User, Book, Borrow)
│   │   ├── routes/             # Express routers
│   │   └── app.js              # Express app + route wiring
│   ├── server.js                # entry point
│   ├── .env                     # local config (not committed)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js         # axios instance + auth header
    │   ├── context/            # AuthContext, NotificationContext, BookmarkContext
    │   ├── components/          # Navbar, Sidebar, ProfileMenu, NotificationBell,
    │   │                        # BookCatalogCard, BookDetailModal, AddBookModal,
    │   │                        # BorrowRecordRow, ReservationSuccessModal, StatusBadge
    │   ├── utils/                # dateFormat, bookCover helpers
    │   └── pages/                # Login, Register,
    │                              # Student{Catalog,Reservations,Borrowed}Page,
    │                              # Staff{Catalog,Reservations,Borrowed}Page
    ├── .env                      # local config (not committed)
    └── .env.example
```

## 1. Database setup (XAMPP)

1. Start **Apache** and **MySQL** from the XAMPP control panel.
2. Import the schema either via phpMyAdmin (`Import` → select
   `backend/database/schema.sql`) or from a terminal:
   ```
   "C:\xampp\mysql\bin\mysql.exe" -u root -p < backend/database/schema.sql
   ```
   This creates the `library_db` database with `users`, `books`, and
   `borrow_records` tables, plus two seed accounts (password: `password123`):
   - Staff: `staff@example.com`
   - Student: `student@example.com`

## 2. Backend setup

```
cd backend
npm install
copy .env.example .env      # then edit DB_PASSWORD / JWT_SECRET as needed
npm run dev                 # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### API overview

| Method | Route                     | Access        | Description              |
|--------|---------------------------|---------------|--------------------------|
| POST   | /api/auth/register        | public        | Create staff/student account |
| POST   | /api/auth/login           | public        | Login, returns JWT       |
| GET    | /api/auth/me              | authenticated | Current user profile     |
| GET    | /api/books                | authenticated | List all books           |
| POST   | /api/books                | staff         | Add a book (title, author, isbn, category, publisher, publishedDate, description, totalCopies) |
| PUT    | /api/books/:id            | staff         | Update a book             |
| DELETE | /api/books/:id            | staff         | Delete a book              |
| POST   | /api/borrows              | student       | Reserve a book (bookId, purpose, requestStartDate, requestEndDate, requestTime, policyAgreed) — status → `reserved`, generates a reference number |
| PATCH  | /api/borrows/:id/handover | staff         | Hand the physical book over (status → `borrowed`) |
| PATCH  | /api/borrows/:id/return   | staff         | Mark a book as returned (status → `returned`) |
| GET    | /api/borrows/mine         | student       | My reservations/loans      |
| GET    | /api/borrows              | staff         | All reservations/loans     |

## 3. Frontend setup

```
cd frontend
npm install
copy .env.example .env      # VITE_API_URL should point at the backend
npm run dev                 # starts on http://localhost:5173
```

## Running both at once (optional)

From the project root you can install and run both servers together
instead of `cd`-ing into each folder:

```
npm install                 # installs root devDependency (concurrently)
npm run install:all         # installs backend + frontend dependencies
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
