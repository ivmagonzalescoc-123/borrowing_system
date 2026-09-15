-- Library Borrowing System schema
-- Import via phpMyAdmin (XAMPP) or:
--   mysql -u root -p library_db < schema.sql
--
-- No CREATE DATABASE/USE here: migrate.js connects with the target
-- database already selected (via DB_NAME), since hosted MySQL providers
-- (Render, Clever Cloud, etc.) provision one fixed database per account and
-- don't grant privileges to create or switch to another one.

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
  cover_url VARCHAR(500) DEFAULT NULL,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Server-persisted notifications so a student sees updates (book handed over,
-- book returned) made by staff in a different session, not just their own.
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
VALUES ('02-2324-12345', 'Juan Dela Cruz', 'student@example.com', '$2a$10$Lcal717CrrxthoqzRsc56Ons7XaGFnPyTVJt89zoAgjL.pVHRvxAG', 'student', 'BSIT')
ON DUPLICATE KEY UPDATE id_number = id_number;

-- This library is reference-only: drop the old fiction/fantasy sample data
-- that earlier versions of this file seeded. Safe to run on every startup —
-- deleting rows that no longer exist (already-cleaned databases) is a no-op.
DELETE FROM books WHERE isbn IN (
  '9780451524935', -- 1984
  '9780061120084', -- To Kill a Mockingbird
  '9780743273565', -- The Great Gatsby
  '9780141439518', -- Pride and Prejudice
  '9780316769488', -- The Catcher in the Rye
  '9780060850524', -- Brave New World
  '9780547928227', -- The Hobbit
  '9781451673319', -- Fahrenheit 451
  '9780451526342', -- Animal Farm
  '9780142437247', -- Moby-Dick
  '9780141441146', -- Jane Eyre
  '9780141439471'  -- Frankenstein
);

INSERT INTO books (title, author, isbn, category, publisher, published_date, description, cover_url, total_copies, available_copies) VALUES
('Clean Code', 'Robert C. Martin', '9780132350884', 'Software Engineering', 'Prentice Hall', '2008-08-01',
 'A handbook of agile software craftsmanship that teaches how to write readable, maintainable code through practical examples and case studies.',
 '/assets/img/9780132350884.jpg', 3, 3),
('The Pragmatic Programmer', 'Andrew Hunt', '9780135957059', 'Software Engineering', 'Addison-Wesley', '2019-09-13',
 'A classic guide of tips and practices for becoming a more effective, adaptable, and pragmatic software developer.',
 '/assets/img/9780135957059.jpg', 2, 2),
('Introduction to Algorithms', 'Thomas H. Cormen', '9780262033848', 'Computer Science', 'MIT Press', '2009-07-31',
 'A comprehensive textbook covering a broad range of algorithms, their design, analysis, and implementation.',
 '/assets/img/9780262033848.jpg', 2, 2),
('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma', '9780201633610', 'Software Engineering', 'Addison-Wesley', '1994-10-21',
 'A catalog of simple and succinct solutions to commonly occurring design problems in object-oriented software.',
 '/assets/img/9780201633610.jpg', 2, 2),
('Refactoring: Improving the Design of Existing Code', 'Martin Fowler', '9780201485677', 'Software Engineering', 'Addison-Wesley', '1999-07-08',
 'A guide to improving the internal structure of existing code without changing its external behavior.',
 '/assets/img/9780201485677.jpg', 2, 2),
('The Mythical Man-Month', 'Frederick P. Brooks Jr.', '9780201835953', 'Software Engineering', 'Addison-Wesley', '1975-01-01',
 'A classic collection of essays on software engineering and project management, addressing why adding manpower to a late project makes it later.',
 '/assets/img/9780201835953.jpg', 2, 2),
('Structure and Interpretation of Computer Programs', 'Harold Abelson', '9780262510875', 'Computer Science', 'MIT Press', '1985-07-25',
 'A foundational textbook introducing the fundamental concepts of computer programming using the Scheme language.',
 '/assets/img/9780262510875.jpg', 2, 2),
('Code Complete', 'Steve McConnell', '9780735619678', 'Software Engineering', 'Microsoft Press', '2004-06-09',
 'A practical handbook of software construction techniques, covering everything from variable naming to system integration.',
 '/assets/img/9780735619678.jpg', 2, 2),
('Head First Design Patterns', 'Eric Freeman', '9780596007126', 'Software Engineering', 'O''Reilly Media', '2004-10-25',
 'A visually rich guide to design patterns that uses a conversational, brain-friendly approach to teach object-oriented design.',
 '/assets/img/9780596007126.jpg', 2, 2),
('Database System Concepts', 'Abraham Silberschatz', '9780078022159', 'Computer Science', 'McGraw-Hill Education', '2010-01-01',
 'A comprehensive introduction to database systems, covering design, implementation, and management of relational databases.',
 '/assets/img/9780078022159.jpg', 2, 2),
('Computer Networking: A Top-Down Approach', 'James Kurose', '9780133594140', 'Computer Science', 'Pearson', '2012-03-15',
 'An accessible introduction to computer networking concepts using a top-down, application-layer-first approach.',
 '/assets/img/9780133594140.jpg', 2, 2),
('Operating System Concepts', 'Abraham Silberschatz', '9781119800361', 'Operating Systems', 'Wiley', '2021-04-06',
 'A core reference on operating system design, covering process management, memory, storage, and system security.',
 NULL, 2, 2),
('Computer Organization and Design: The Hardware/Software Interface', 'David A. Patterson', '9780128122754', 'Computer Architecture', 'Morgan Kaufmann', '2017-11-23',
 'A foundational reference on computer architecture, explaining the interface between hardware design and software performance.',
 NULL, 2, 2),
('Artificial Intelligence: A Modern Approach', 'Stuart Russell', '9780134610993', 'Artificial Intelligence', 'Pearson', '2020-04-28',
 'The standard reference on AI, covering search, knowledge representation, machine learning, and intelligent agents.',
 NULL, 2, 2),
('Discrete Mathematics and Its Applications', 'Kenneth H. Rosen', '9781259676512', 'Mathematics', 'McGraw-Hill Education', '2018-01-01',
 'A comprehensive reference on the discrete mathematics underlying computer science, including logic, proofs, and graph theory.',
 NULL, 2, 2),
('Software Engineering', 'Ian Sommerville', '9780133943030', 'Software Engineering', 'Pearson', '2015-03-20',
 'A widely used reference covering the full software development lifecycle, from requirements to system maintenance.',
 NULL, 2, 2),
('The C Programming Language', 'Brian W. Kernighan', '9780131103627', 'Programming', 'Prentice Hall', '1988-03-01',
 'The definitive reference to the C language, written by its creators, covering syntax, semantics, and standard library usage.',
 NULL, 2, 2),
('Effective Java', 'Joshua Bloch', '9780134685991', 'Programming', 'Addison-Wesley', '2017-12-27',
 'A practical reference of best-practice items for writing clear, correct, and efficient Java code.',
 NULL, 2, 2),
('Computer Security: Principles and Practice', 'William Stallings', '9780134794105', 'Information Security', 'Pearson', '2017-07-17',
 'A comprehensive reference on computer security, covering cryptography, network security, and software security practices.',
 NULL, 2, 2),
('Modern Operating Systems', 'Andrew S. Tanenbaum', '9780133591620', 'Operating Systems', 'Pearson', '2014-03-28',
 'A detailed reference on operating system principles, covering processes, deadlocks, file systems, and distributed systems.',
 NULL, 2, 2),
('Compilers: Principles, Techniques, and Tools', 'Alfred V. Aho', '9780321486813', 'Computer Science', 'Addison-Wesley', '2006-08-31',
 'The classic reference on compiler construction, covering lexical analysis, parsing, code generation, and optimization.',
 NULL, 2, 2)
ON DUPLICATE KEY UPDATE title = title;
