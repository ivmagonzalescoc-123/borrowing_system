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
  cover_url VARCHAR(500) DEFAULT NULL,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adds cover_url to a books table created before this column existed; no-op
-- on a fresh install since CREATE TABLE above already includes it.
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500) DEFAULT NULL;

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
('1984', 'George Orwell', '9780451524935', 'Fiction', 'Signet Classics', '1950-07-01',
 'A dystopian social science fiction novel exploring themes of totalitarianism, mass surveillance, and repressive regimentation of all persons in society.',
 '/assets/img/9780451524935.jpg', 3, 3),
('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Fiction', 'Harper Perennial Modern Classics', '1960-07-11',
 'A powerful story of racial injustice and childhood innocence in the Depression-era South, told through the eyes of a young girl.',
 '/assets/img/9780061120084.jpg', 3, 3),
('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 'Scribner', '1925-04-10',
 'A tragic tale of wealth, love, and the elusive American Dream set in the Jazz Age.',
 '/assets/img/9780743273565.jpg', 3, 3),
('Pride and Prejudice', 'Jane Austen', '9780141439518', 'Fiction', 'Penguin Classics', '1813-01-28',
 'A witty exploration of manners, marriage, and morality in early 19th-century England.',
 '/assets/img/9780141439518.jpg', 2, 2),
('The Catcher in the Rye', 'J.D. Salinger', '9780316769488', 'Fiction', 'Little, Brown and Company', '1951-07-16',
 'A coming-of-age story following the disillusioned teenager Holden Caulfield through New York City.',
 '/assets/img/9780316769488.jpg', 2, 2),
('Brave New World', 'Aldous Huxley', '9780060850524', 'Fiction', 'Harper Perennial', '1932-01-01',
 'A dystopian vision of a future society engineered for stability through genetic conditioning and consumerism.',
 '/assets/img/9780060850524.jpg', 2, 2),
('The Hobbit', 'J.R.R. Tolkien', '9780547928227', 'Fantasy', 'Houghton Mifflin Harcourt', '1937-09-21',
 'The tale of Bilbo Baggins, a hobbit who embarks on an unexpected adventure with a group of dwarves and a wizard.',
 '/assets/img/9780547928227.jpg', 3, 3),
('Fahrenheit 451', 'Ray Bradbury', '9781451673319', 'Fiction', 'Simon and Schuster', '1953-10-19',
 'A future society where books are outlawed and burned, seen through the eyes of a fireman who begins to question his role.',
 '/assets/img/9781451673319.jpg', 2, 2),
('Animal Farm', 'George Orwell', '9780451526342', 'Fiction', 'Signet Classics', '1945-08-17',
 'An allegorical novella reflecting events leading up to the Russian Revolution and the Stalinist era, told through farm animals.',
 '/assets/img/9780451526342.jpg', 2, 2),
('Moby-Dick', 'Herman Melville', '9780142437247', 'Fiction', 'Penguin Classics', '1851-10-18',
 'The epic tale of Captain Ahab''s obsessive quest for revenge against the great white whale.',
 '/assets/img/9780142437247.jpg', 2, 2),
('Jane Eyre', 'Charlotte Bronte', '9780141441146', 'Fiction', 'Penguin Classics', '1847-10-16',
 'The story of an orphaned girl who grows into an independent woman while navigating love, class, and morality.',
 '/assets/img/9780141441146.jpg', 2, 2),
('Frankenstein', 'Mary Shelley', '9780141439471', 'Fiction', 'Penguin Classics', '1818-01-01',
 'A scientist creates a sapient creature in an unorthodox experiment, exploring themes of ambition and responsibility.',
 '/assets/img/9780141439471.jpg', 2, 2),
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
 '/assets/img/9780133594140.jpg', 2, 2)
ON DUPLICATE KEY UPDATE title = title;
