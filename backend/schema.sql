-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Master list of exercises for new users
CREATE TABLE IF NOT EXISTS master_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    muscle_group TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User-specific exercises (copied from master)
CREATE TABLE IF NOT EXISTS user_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    muscle_group TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    notes TEXT,
    prs INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES user_exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    rpe REAL,
    notes TEXT,
    FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
);

-- Table to store workout templates
CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, -- The user who owns the template
    name TEXT NOT NULL,       -- Name of the template (e.g., "Template 1")
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table to store exercises within a template
CREATE TABLE IF NOT EXISTS template_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL, -- Links to the template
    exercise_id INTEGER NOT NULL, -- Links to the user-specific exercise
    sets INTEGER NOT NULL,        -- Number of sets prescribed for the exercise
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES user_exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);


-- Indexes for performance
CREATE INDEX idx_templates_user ON templates(user_id);
CREATE INDEX idx_template_exercises_template ON template_exercises(template_id);
CREATE INDEX idx_template_exercises_exercise ON template_exercises(exercise_id);

-- Indexes for performance
CREATE INDEX idx_user_exercises_user ON user_exercises(user_id);
CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_sets_workout_exercise ON sets(workout_exercise_id);

-- Create trigger to copy master exercises when new user is created
CREATE TRIGGER IF NOT EXISTS copy_master_exercises
AFTER INSERT ON users
BEGIN
    INSERT INTO user_exercises (user_id, name, description, muscle_group)
    SELECT NEW.id, name, description, muscle_group
    FROM master_exercises;
END;
