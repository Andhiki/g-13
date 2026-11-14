CREATE TABLE IF NOT EXISTS professors (
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
  professor_id TEXT NOT NULL REFERENCES professors(id),
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

CREATE INDEX IF NOT EXISTS reviews_professor_course_idx ON reviews(professor_id, course_id);
CREATE INDEX IF NOT EXISTS reviews_status_deleted_idx ON reviews(status, deleted_at);
