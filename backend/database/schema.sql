-- Library Borrowing System schema
-- Import via phpMyAdmin (XAMPP) or:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- Staff and students both log in through this table.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_number VARCHAR(50) NOT NULL UNIQUE,   -- staff ID or student ID
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('staff', 'student') NOT NULL DEFAULT 'student',
  course VARCHAR(100) DEFAULT NULL,        -- students only
  department VARCHAR(100) DEFAULT NULL,    -- staff only
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(150) NOT NULL,
  isbn VARCHAR(30) DEFAULT NULL UNIQUE,
  category VARCHAR(100) DEFAULT NULL,
  publisher VARCHAR(150) DEFAULT NULL,
  published_date DATE DEFAULT NULL,
  description TEXT DEFAULT NULL,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lifecycle: reserved (student requests) -> borrowed (staff hands the book
-- over) -> returned (staff receives the book back).
CREATE TABLE IF NOT EXISTS borrow_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_no VARCHAR(20) NOT NULL UNIQUE,
  book_id INT NOT NULL,
  student_id INT NOT NULL,
  staff_id INT DEFAULT NULL,               -- staff who handed the book over
  purpose VARCHAR(255) DEFAULT NULL,
  request_start_date DATE DEFAULT NULL,
  request_end_date DATE DEFAULT NULL,
  request_time TIME DEFAULT NULL,
  status ENUM('reserved', 'borrowed', 'returned') NOT NULL DEFAULT 'reserved',
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  borrowed_at TIMESTAMP NULL DEFAULT NULL,
  due_date DATE DEFAULT NULL,              -- set once the book is handed over
  returned_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Sample data (passwords are bcrypt hashes of "password123")
-- Generate your own with: node -e "console.log(require('bcryptjs').hashSync('password123', 10))"
INSERT INTO users (id_number, full_name, email, password_hash, role, department)
VALUES ('STF-001', 'Librarian Admin', 'staff@example.com', '$2a$10$Lcal717CrrxthoqzRsc56Ons7XaGFnPyTVJt89zoAgjL.pVHRvxAG', 'staff', 'Library')
ON DUPLICATE KEY UPDATE id_number = id_number;

INSERT INTO users (id_number, full_name, email, password_hash, role, course)
VALUES ('STU-001', 'Juan Dela Cruz', 'student@example.com', '$2a$10$Lcal717CrrxthoqzRsc56Ons7XaGFnPyTVJt89zoAgjL.pVHRvxAG', 'student', 'BSIT')
ON DUPLICATE KEY UPDATE id_number = id_number;

INSERT INTO books (title, author, isbn, category, publisher, published_date, description, total_copies, available_copies) VALUES
('Clean Code', 'Robert C. Martin', '9780132350884', 'Software Engineering', 'Prentice Hall', '2008-08-01',
 'A handbook of agile software craftsmanship that teaches how to write readable, maintainable code through practical examples and case studies.', 3, 3),
('The Pragmatic Programmer', 'Andrew Hunt', '9780135957059', 'Software Engineering', 'Addison-Wesley', '2019-09-13',
 'A classic guide of tips and practices for becoming a more effective, adaptable, and pragmatic software developer.', 2, 2),
('Introduction to Algorithms', 'Thomas H. Cormen', '9780262033848', 'Computer Science', 'MIT Press', '2009-07-31',
 'A comprehensive textbook covering a broad range of algorithms, their design, analysis, and implementation.', 2, 2)
ON DUPLICATE KEY UPDATE title = title;
