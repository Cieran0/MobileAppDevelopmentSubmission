#[cfg(test)]
mod tests {
    use super::super::database_handler::*;
    use super::super::wt_types::*;
    use chrono::{DateTime, Utc};
    use rusqlite::Connection;

    fn setup_database() -> Connection {
        let conn = Connection::open_in_memory().unwrap();

        // Create tables for testing
        conn.execute(
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE sessions (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                session_token TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE user_exercises (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                muscle_group TEXT NOT NULL
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE workouts (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                notes TEXT,
                prs INTEGER DEFAULT 0
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE workout_exercises (
                id INTEGER PRIMARY KEY,
                workout_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE sets (
                id INTEGER PRIMARY KEY,
                workout_exercise_id INTEGER NOT NULL,
                set_number INTEGER NOT NULL,
                weight REAL NOT NULL,
                reps INTEGER NOT NULL
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE templates (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE template_exercises (
                id INTEGER PRIMARY KEY,
                template_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                sets INTEGER NOT NULL
            )",
            [],
        )
        .unwrap();

        conn
    }

    fn register_and_login_user(db_handler: &DatabaseHandler) -> (u32, String) {
        let username = "testuser";
        let password = "password123";

        // Register the user
        let user_id = db_handler.register_user(username, password).unwrap();

        // Log in the user
        let session_token = db_handler.login(username, password).unwrap();

        (user_id, session_token)
    }

    #[test]
    fn test_register_user() {
        let conn = setup_database();
        let db_handler = DatabaseHandler { conn };

        let username = "testuser";
        let password = "password123";

        let user_id = db_handler.register_user(username, password).unwrap();

        assert!(user_id > 0);

        let mut stmt = db_handler.conn.prepare("SELECT username FROM users WHERE id = ?1").unwrap();
        let result: String = stmt.query_row([user_id], |row| row.get(0)).unwrap();
        assert_eq!(result, username);
    }

    #[test]
    fn test_login_valid_credentials() {
        let conn = setup_database();
        let db_handler = DatabaseHandler { conn };

        let username = "testuser";
        let password = "password123";

        db_handler.register_user(username, password).unwrap();

        let session_token = db_handler.login(username, password).unwrap();
        assert_eq!(session_token.len(), 32);

        let mut stmt = db_handler.conn.prepare("SELECT session_token FROM sessions WHERE user_id = ?1").unwrap();
        let stored_token: String = stmt.query_row([1], |row| row.get(0)).unwrap();
        assert_eq!(stored_token, session_token);
    }

    #[test]
    fn test_login_invalid_credentials() {
        let conn = setup_database();
        let db_handler = DatabaseHandler { conn };

        let username = "testuser";
        let password = "password123";

        db_handler.register_user(username, password).unwrap();

        let result = db_handler.login(username, "wrongpassword");
        assert!(result.is_err());
    }

    #[test]
    fn test_add_exercise_to_user() {
        let conn = setup_database();
        let db_handler = DatabaseHandler { conn };

        // Register and log in the user
        let (_, session_token) = register_and_login_user(&db_handler);

        let request = ExerciseRequest {
            user_id: session_token,
            name: "Bench Press".to_string(),
            body_part: "Chest".to_string(),
        };

        let exercise_id = db_handler.add_exercise_to_user(request).unwrap();
        assert!(exercise_id > 0);

        let mut stmt = db_handler.conn.prepare("SELECT name FROM user_exercises WHERE id = ?1").unwrap();
        let result: String = stmt.query_row([exercise_id], |row| row.get(0)).unwrap();
        assert_eq!(result, "Bench Press");
    }

    #[test]
    fn test_get_user_exercises() {
        let conn = setup_database();
        let db_handler = DatabaseHandler { conn };

        // Register and log in the user
        let (user_id, session_token) = register_and_login_user(&db_handler);

        let request = ExerciseRequest {
            user_id: session_token.clone(),
            name: "Bench Press".to_string(),
            body_part: "Chest".to_string(),
        };

        db_handler.add_exercise_to_user(request).unwrap();

        let exercises = db_handler.get_user_exercises(user_id).unwrap();
        assert_eq!(exercises.len(), 1);
        assert_eq!(exercises[0].name, "Bench Press");
    }

}