CREATE TABLE IF NOT EXISTS lecturers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  name_id TEXT NOT NULL,
  name_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY NOT NULL,
  lecturer_id TEXT NOT NULL REFERENCES lecturers(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  term_label TEXT NOT NULL,
  author_name TEXT NOT NULL,
  clarity INTEGER NOT NULL CHECK (clarity BETWEEN 1 AND 5),
  support INTEGER NOT NULL CHECK (support BETWEEN 1 AND 5),
  organization INTEGER NOT NULL CHECK (organization BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS review_likes (
  review_id TEXT NOT NULL REFERENCES reviews(id),
  browser_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (review_id, browser_id)
);

CREATE INDEX IF NOT EXISTS reviews_lecturer_course_idx ON reviews(lecturer_id, course_id);
CREATE INDEX IF NOT EXISTS reviews_status_deleted_idx ON reviews(status, deleted_at);

CREATE TABLE IF NOT EXISTS review_submission_limits (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_session (
  id TEXT PRIMARY KEY NOT NULL,
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS auth_session_user_idx ON auth_session(user_id);

CREATE TABLE IF NOT EXISTS auth_account (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_account_user_idx ON auth_account(user_id);

CREATE TABLE IF NOT EXISTS auth_verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_verification_identifier_idx ON auth_verification(identifier);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
