use std::{
    collections::HashMap, fs::File, io::prelude::*, path::Path
};
use chrono::Utc;
use rand::Rng;
use rusqlite::{params, OptionalExtension};
use serde_json::json;
use crate::{database_handler::{self, DatabaseHandler, ExerciseRequest, TemplateRequest}, tracker::{self, edit, extract_meta_data, Metadata}, wt_types::*};

fn convert_db_exercise(db_ex: &database_handler::Exercise) -> Exercise {
    let best_set_string = db_ex.best_set.clone().unwrap_or("".to_string());
    Exercise {
        id: db_ex.id,
        name: db_ex.name.clone(),
        body_part: db_ex.muscle_group.clone(),
        best_set: best_set_string
    }
}

pub fn handle_one_rep_max_route(
    query_params: HashMap<String, String>,
    db_handler: &DatabaseHandler,
) -> (&'static str, String, &'static str) {
    match (
        query_params.get("userid"),
        query_params.get("exercise_id").and_then(|s| s.parse::<u32>().ok()),
    ) {
        (Some(userid), Some(exercise_id)) => {
            match db_handler.get_user_id_from_token(&userid) {
                Ok(parsed_userid) => match db_handler.get_1_rep_maxes(parsed_userid, exercise_id) {
                    Ok(one_rep_max_data) => {
                        let json_contents = serde_json::to_string_pretty(&one_rep_max_data).unwrap();
                        ("HTTP/1.1 200 OK", json_contents, "application/json")
                    }
                    Err(err) => {
                        println!("Error fetching 1 rep max data: {}", err);
                        (
                            "HTTP/1.1 500 INTERNAL SERVER ERROR",
                            format!(r#"{{"error": "{}"}}"#, err),
                            "application/json",
                        )
                    }
                },
                Err(err) => {
                    println!("Error getting user ID from token: {}", err);
                    (
                        "HTTP/1.1 401 UNAUTHORIZED",
                        format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                        "application/json",
                    )
                }
            }
        }
        _ => (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Invalid or missing userid or exercise_id"}"#.to_string(),
            "application/json",
        ),
    }
}

pub fn handle_previous_sets_route(
    query_params: HashMap<String, String>,
    db_handler: &DatabaseHandler,
) -> (&'static str, String, &'static str) {
    match (
        query_params.get("userid"),
        query_params.get("exercise_id").and_then(|s| s.parse::<u32>().ok()),
    ) {
        (Some(userid), Some(exercise_id)) => {
            match db_handler.get_user_id_from_token(&userid) {
                Ok(parsed_userid) => match db_handler.get_previous_sets(parsed_userid, exercise_id) {
                    Ok(previous_sets) => {
                        let json_contents = serde_json::to_string_pretty(&previous_sets).unwrap();
                        ("HTTP/1.1 200 OK", json_contents, "application/json")
                    }
                    Err(err) => {
                        println!("Error fetching previous sets: {}", err);
                        (
                            "HTTP/1.1 500 INTERNAL SERVER ERROR",
                            format!(r#"{{"error": "{}"}}"#, err),
                            "application/json",
                        )
                    }
                },
                Err(err) => {
                    println!("Error getting user ID from token: {}", err);
                    (
                        "HTTP/1.1 401 UNAUTHORIZED",
                        format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                        "application/json",
                    )
                }
            }
        }
        _ => (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Invalid or missing userid or exercise_id"}"#.to_string(),
            "application/json",
        ),
    }
}

pub fn handle_workouts_per_week_route(
    query_params: HashMap<String, String>,
    db_handler: &DatabaseHandler,
) -> (&'static str, String, &'static str) {
    match query_params.get("userid") {
        Some(userid) => match db_handler.get_user_id_from_token(&userid) {
            Ok(parsed_userid) => match db_handler.get_workouts_per_week(parsed_userid) {
                Ok(history_data) => {
                    let json_contents = serde_json::to_string_pretty(&history_data).unwrap();
                    ("HTTP/1.1 200 OK", json_contents, "application/json")
                }
                Err(err) => (
                    "HTTP/1.1 500 INTERNAL SERVER ERROR",
                    format!(r#"{{"error": "{}"}}"#, err),
                    "application/json",
                ),
            },
            Err(err) => {
                println!("Error getting user ID from token: {}", err);
                (
                    "HTTP/1.1 401 UNAUTHORIZED",
                    format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                    "application/json",
                )
            }
        },
        None => (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Invalid or missing userid"}"#.to_string(),
            "application/json",
        ),
    }
}

pub fn handle_add_exercise_route<R: BufRead>(
    buf_reader: R,
    db_handler: &DatabaseHandler,
    content_length: usize,
) -> (&'static str, String, &'static str) {
    let mut body = String::new();
    if content_length > 0 {
        let mut body_reader = buf_reader.take(content_length as u64);
        if let Err(err) = body_reader.read_to_string(&mut body) {
            println!("Error {}", err);
            return (
                "HTTP/1.1 400 BAD REQUEST",
                r#"{"error": "Failed to read request body"}"#.to_string(),
                "application/json",
            );
        }
    }

    let exercise_req: ExerciseRequest = match serde_json::from_str(&body) {
        Ok(req) => req,
        Err(err) => {
            println!("Error {}", err);
            return (
                "HTTP/1.1 400 BAD REQUEST",
                r#"{"error": "Invalid JSON format"}"#.to_string(),
                "application/json",
            );
        }
    };

    if exercise_req.name.is_empty() || exercise_req.body_part.is_empty() {
        return (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Name and body_part are required"}"#.to_string(),
            "application/json",
        );
    }

    match db_handler.get_user_id_from_token(&exercise_req.user_id) {
        Ok(parsed_userid) => {
            if let Err(err) = db_handler.is_valid_user(parsed_userid) {
                println!("Error validating user: {}", err);
                return (
                    "HTTP/1.1 400 BAD REQUEST",
                    r#"{"error": "Invalid user_id"}"#.to_string(),
                    "application/json",
                );
            }
            match db_handler.add_exercise_to_user(exercise_req) {
                Ok(exercise_id) => (
                    "HTTP/1.1 201 CREATED",
                    format!(r#"{{"exercise_id": {}}}"#, exercise_id),
                    "application/json",
                ),
                Err(err) => {
                    println!("Error adding exercise: {}", err);
                    (
                        "HTTP/1.1 500 INTERNAL SERVER ERROR",
                        format!(r#"{{"error": "{}"}}"#, err),
                        "application/json",
                    )
                },
            }
        }
        Err(err) => {
            println!("Error getting user ID from token: {}", err);
            (
                "HTTP/1.1 401 UNAUTHORIZED",
                format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                "application/json",
            )
        }
    }
}

pub fn handle_history_route(
    query_params: HashMap<String, String>,
    db_handler: &DatabaseHandler,
) -> (&'static str, String, &'static str) {
    match query_params.get("userid") {
        Some(userid) => match db_handler.get_user_id_from_token(&userid) {
            Ok(parsed_userid) => match db_handler.get_history_data(parsed_userid) {
                Ok(history_data) => {
                    let json_contents = serde_json::to_string_pretty(&history_data).unwrap();
                    ("HTTP/1.1 200 OK", json_contents, "application/json")
                }
                Err(err) => {
                    println!("Error fetching history data: {}", err);
                    (
                        "HTTP/1.1 500 INTERNAL SERVER ERROR",
                        format!(r#"{{"error": "{}"}}"#, err),
                        "application/json",
                    )
                },
            },
            Err(err) => {
                println!("Error getting user ID from token: {}", err);
                (
                    "HTTP/1.1 401 UNAUTHORIZED",
                    format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                    "application/json",
                )
            }
        },
        None => (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Invalid or missing userid"}"#.to_string(),
            "application/json",
        ),
    }
}

pub fn handle_exercises_route(
    query_params: HashMap<String, String>,
    db_handler: &DatabaseHandler,
) -> (&'static str, String, &'static str) {
    match query_params.get("userid") {
        Some(userid) => match db_handler.get_user_id_from_token(&userid) {
            Ok(parsed_userid) => match db_handler.get_user_exercises(parsed_userid) {
                Ok(db_exercises) => {
                    let exercises: Vec<Exercise> = db_exercises.iter().map(convert_db_exercise).collect();
                    let json_contents = serde_json::to_string_pretty(&exercises).unwrap();
                    ("HTTP/1.1 200 OK", json_contents, "application/json")
                }
                Err(err) => {
                    println!("Error fetching exercises: {}", err);
                    (
                        "HTTP/1.1 500 INTERNAL SERVER ERROR",
                        "<html><body>500 INTERNAL SERVER ERROR</body></html>".to_string(),
                        "text/html",
                    )
                },
            },
            Err(err) => {
                println!("Error getting user ID from token: {}", err);
                (
                    "HTTP/1.1 401 UNAUTHORIZED",
                    format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                    "application/json",
                )
            }
        },
        None => (
            "HTTP/1.1 400 BAD REQUEST",
            "<html><body>400 BAD REQUEST: Invalid or missing userid</body></html>".to_string(),
            "text/html",
        ),
    }
}

pub fn handle_workout_route<R: BufRead>(
    buf_reader: R,
    query_params: HashMap<String, String>,
    db_handler: &DatabaseHandler,
    content_length: usize,
) -> (&'static str, String, &'static str) {
    match query_params.get("userid") {
        Some(userid) => match db_handler.get_user_id_from_token(&userid) {
            Ok(parsed_userid) => {
                let mut body = String::new();
                if content_length > 0 {
                    let mut body_reader = buf_reader.take(content_length as u64);
                    body_reader.read_to_string(&mut body).unwrap();
                }
                let workout: Workout = serde_json::from_str(body.trim()).unwrap();
                match db_handler.save_workout(workout, parsed_userid) {
                    Ok(result) => {
                        println!("Saved {} sets", result);
                        (
                            "HTTP/1.1 200 OK",
                            format!(r#"{{ "user_id": {}, "success": true }}"#, parsed_userid),
                            "application/json",
                        )
                    }
                    Err(_) => (
                        "HTTP/1.1 500 INTERNAL SERVER ERROR",
                        r#"{"error": "Failed to save workout"}"#.to_string(),
                        "application/json",
                    ),
                }
            }
            Err(err) => {
                println!("Error getting user ID from token: {}", err);
                (
                    "HTTP/1.1 401 UNAUTHORIZED",
                    format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                    "application/json",
                )
            }
        },
        None => (
            "HTTP/1.1 400 BAD REQUEST",
            format!(r#"{{ "error": "{}", "success": false }}"#, "Invalid or missing userid"),
            "application/json",
        ),
    }
}

pub fn handle_video_upload<R: BufRead>(
    buf_reader: R,
    content_length: usize,
    content_type: String,
) -> (&'static str, String, &'static str) {
    let mut body = Vec::new();
    if content_length > 0 {
        let mut body_reader = buf_reader.take(content_length as u64);
        body_reader.read_to_end(&mut body).unwrap();
    }

    let boundary = if let Some(pos) = content_type.find("boundary=") {
        let boundary_str = &content_type[pos + "boundary=".len()..];
        format!("--{}", boundary_str)
    } else {
        return (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Boundary not found in Content-Type header"}"#.to_string(),
            "application/json",
        );
    };

    let boundary_bytes = boundary.as_bytes();
    let parts = split_body_by_boundary(&body, boundary_bytes);

    for part in parts {
        if part.is_empty() || part == b"\r\n" {
            continue;
        }

        if let Some(old_filename) = extract_filename_from_part(part) {
            let file_data = extract_file_data_from_part(part);
            let timestamp = Utc::now().to_rfc3339().replace(":", "-");
            let filename = format!("{}_{}", timestamp, old_filename);
            let file_path = format!("./uploads/{}", filename);
            let mut file = File::create(&file_path).unwrap();
            file.write_all(&file_data).unwrap();
            return (
                "HTTP/1.1 200 OK",
                format!(r#"{{"fileUrl": "./uploads/{}"}}"#, filename),
                "application/json",
            );
        }
    }

    println!("Error: No video file provided");
    (
        "HTTP/1.1 400 BAD REQUEST",
        r#"{"error": "No video file provided"}"#.to_string(),
        "application/json",
    )
}

pub fn split_body_by_boundary<'a>(body: &'a [u8], boundary: &[u8]) -> Vec<&'a [u8]> {
    let mut parts = Vec::new();
    let mut start = 0;

    while start < body.len() {
        if let Some(pos) = body[start..].windows(boundary.len()).position(|window| window == boundary) {
            parts.push(&body[start..start + pos]);
            start += pos + boundary.len();
        } else {
            parts.push(&body[start..]);
            break;
        }
    }

    parts
}

pub fn extract_filename_from_part(part: &[u8]) -> Option<String> {
    let filename_key = b"filename=\"";
    if let Some(start_pos) = part.windows(filename_key.len()).position(|window| window == filename_key) {
        let start_pos = start_pos + filename_key.len();
        if let Some(end_pos) = part[start_pos..].iter().position(|&byte| byte == b'"') {
            let filename = String::from_utf8_lossy(&part[start_pos..start_pos + end_pos]);
            return Some(filename.to_string());
        }
    }
    None
}

pub fn extract_file_data_from_part(part: &[u8]) -> Vec<u8> {
    if let Some(data_start_pos) = part.windows(4).position(|window| window == b"\r\n\r\n") {
        let mut data = part[data_start_pos + 4..].to_vec();
        while data.ends_with(&[b'\r']) || data.ends_with(&[b'\n']) {
            data.pop();
        }
        return data;
    }
    Vec::new()
}

fn get_random_processed_path() -> String {
    let prefix = "processed/";
    let suffix = ".mp4";
    let random_string: String = (0..10)
        .map(|_| rand::thread_rng().gen_range(b'a'..b'z') as char)
        .collect();
    format!("{}{}{}", prefix, random_string, suffix)
}

pub fn handle_metadata_upload<R: BufRead>(
    buf_reader: R,
    content_length: usize,
) -> (&'static str, String, &'static str) {
    let mut body = String::new();
    if content_length > 0 {
        let mut body_reader = buf_reader.take(content_length as u64);
        body_reader.read_to_string(&mut body).unwrap();
    }

    let md: Metadata = extract_meta_data(body);
    let edited_path = edit(md.clone());

    let x = md.barbell_area.x as i32;
    let y = md.barbell_area.y as i32;
    let width = md.barbell_area.width as i32;
    let height = md.barbell_area.height as i32;

    match edited_path {
        Ok(path) => match tracker::track_video(path, get_random_processed_path(), x, y, width, height) {
            Ok(video) => {
                let video_url = format!("/processed/{}", Path::new(&video.new_path).file_name().unwrap().to_str().unwrap());
                let response_json = json!({
                    "video_url": video_url,
                    "averages": video.averages
                });
                
                return ("HTTP/1.1 200 OK", response_json.to_string(), "application/json");

            }
            Err(_) => {
                let error_response = json!({
                    "error": "Video processing failed"
                });
                return ("HTTP/1.1 500 Internal Server Error", error_response.to_string(), "application/json");
            }
        },
        Err(e) => {
            let error_response = json!({
                "error": format!("Metadata editing failed: {}", e)
            });

            return ("HTTP/1.1 500 Internal Server Error", error_response.to_string(), "application/json");
        }
    }
}

pub fn handle_templates_route(
    query_params: HashMap<String, String>,
    db_handler: &DatabaseHandler,
) -> (&'static str, String, &'static str) {
    match query_params.get("userid") {
        Some(userid) => match db_handler.get_user_id_from_token(&userid) {
            Ok(parsed_userid) => match db_handler.get_templates(parsed_userid) {
                Ok(templates) => {
                    let json_contents = serde_json::to_string_pretty(&templates).unwrap();
                    ("HTTP/1.1 200 OK", json_contents, "application/json")
                }
                Err(err) => {
                    println!("Error retrieving templates: {}", err);
                    (
                        "HTTP/1.1 500 INTERNAL SERVER ERROR",
                        format!(r#"{{"error": "Failed to retrieve templates: {}"}}"#, err),
                        "application/json",
                    )
                }
            },
            Err(err) => {
                println!("Error getting user ID from token: {}", err);
                (
                    "HTTP/1.1 401 UNAUTHORIZED",
                    format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                    "application/json",
                )
            }
        },
        None => (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Invalid or missing userid parameter"}"#.to_string(),
            "application/json",
        ),
    }
}

pub fn handle_save_template_route<R: BufRead>(
    buf_reader: R,
    db_handler: &DatabaseHandler,
    content_length: usize,
) -> (&'static str, String, &'static str) {
    let mut body = String::new();
    if content_length > 0 {
        let mut body_reader = buf_reader.take(content_length as u64);
        if let Err(err) = body_reader.read_to_string(&mut body) {
            println!("Error reading request body: {}", err);
            return (
                "HTTP/1.1 400 BAD REQUEST",
                r#"{"error": "Failed to read request body"}"#.to_string(),
                "application/json",
            );
        }
    }

    let template_request: TemplateRequest = match serde_json::from_str(&body) {
        Ok(req) => req,
        Err(err) => {
            println!("Error deserializing JSON: {}", err);
            return (
                "HTTP/1.1 400 BAD REQUEST",
                r#"{"error": "Invalid JSON format"}"#.to_string(),
                "application/json",
            );
        }
    };

    if template_request.name.is_empty() || template_request.exercises.is_empty() {
        return (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Template name and exercises are required"}"#.to_string(),
            "application/json",
        );
    }

    match db_handler.get_user_id_from_token(&template_request.user_id) {
        Ok(parsed_userid) => {
            if let Err(err) = db_handler.is_valid_user(parsed_userid) {
                println!("Error validating user: {}", err);
                return (
                    "HTTP/1.1 400 BAD REQUEST",
                    r#"{"error": "Invalid user_id"}"#.to_string(),
                    "application/json",
                );
            }
            match db_handler.save_template(template_request) {
                Ok(template_id) => (
                    "HTTP/1.1 201 CREATED",
                    format!(r#"{{"template_id": {}}}"#, template_id),
                    "application/json",
                ),
                Err(err) => {
                    println!("Error saving template: {}", err);
                    (
                        "HTTP/1.1 500 INTERNAL SERVER ERROR",
                        format!(r#"{{"error": "Failed to save template: {}"}}"#, err),
                        "application/json",
                    )
                },
            }
        }
        Err(err) => {
            println!("Error getting user ID from token: {}", err);
            (
                "HTTP/1.1 401 UNAUTHORIZED",
                format!(r#"{{"error": "Invalid token: {}"}}"#, err),
                "application/json",
            )
        }
    }
}

pub fn handle_login_route<R: BufRead>(
    buf_reader: R,
    db_handler: &DatabaseHandler,
    content_length: usize,
) -> (&'static str, String, &'static str) {
    
    let mut body = String::new();
    if content_length > 0 {
        let mut body_reader = buf_reader.take(content_length as u64);
        if let Err(err) = body_reader.read_to_string(&mut body) {
            println!("Error reading request body: {}", err);
            return (
                "HTTP/1.1 400 BAD REQUEST",
                r#"{"error": "Failed to read request body"}"#.to_string(),
                "application/json",
            );
        }
    }

    
    #[derive(serde::Deserialize)]
    struct LoginRequest {
        username: String,
        password_hash: String,
    }

    let login_req: LoginRequest = match serde_json::from_str(&body) {
        Ok(req) => req,
        Err(err) => {
            println!("Error deserializing JSON: {}", err);
            return (
                "HTTP/1.1 400 BAD REQUEST",
                r#"{"error": "Invalid JSON format"}"#.to_string(),
                "application/json",
            );
        }
    };

    
    if login_req.username.is_empty() || login_req.password_hash.is_empty() {
        return (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Username and password_hash are required"}"#.to_string(),
            "application/json",
        );
    }

    
    match db_handler.login(&login_req.username, &login_req.password_hash) {
        Ok(session_token) => {
            
            (
                "HTTP/1.1 200 OK",
                format!(r#"{{"session_token": "{}"}}"#, session_token),
                "application/json",
            )
        }
        Err(_) => {
            
            println!("Login Failed!");
            (
                "HTTP/1.1 401 UNAUTHORIZED",
                r#"{"error": "Invalid username or password"}"#.to_string(),
                "application/json",
            )
        }
    }
}

pub fn handle_register_route<R: BufRead>(
    buf_reader: R,
    db_handler: &DatabaseHandler,
    content_length: usize,
) -> (&'static str, String, &'static str) {
    
    let mut body = String::new();
    if content_length > 0 {
        let mut body_reader = buf_reader.take(content_length as u64);
        if let Err(err) = body_reader.read_to_string(&mut body) {
            println!("Error reading request body: {}", err);
            return (
                "HTTP/1.1 400 BAD REQUEST",
                r#"{"error": "Failed to read request body"}"#.to_string(),
                "application/json",
            );
        }
    }

    
    #[derive(serde::Deserialize)]
    struct RegisterRequest {
        username: String,
        password_hash: String,
    }

    let register_req: RegisterRequest = match serde_json::from_str(&body) {
        Ok(req) => req,
        Err(err) => {
            println!("Error deserializing JSON: {}", err);
            return (
                "HTTP/1.1 400 BAD REQUEST",
                r#"{"error": "Invalid JSON format"}"#.to_string(),
                "application/json",
            );
        }
    };

    
    if register_req.username.is_empty() || register_req.password_hash.is_empty() {
        return (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Username and password_hash are required"}"#.to_string(),
            "application/json",
        );
    }

    
    let mut stmt = match db_handler.conn.prepare("SELECT id FROM users WHERE username = ?1") {
        Ok(stmt) => stmt,
        Err(err) => {
            println!("Error preparing statement: {}", err);
            return (
                "HTTP/1.1 500 INTERNAL SERVER ERROR",
                r#"{"error": "Database error"}"#.to_string(),
                "application/json",
            );
        }
    };

    let username_exists: bool = match stmt.query_row(params![register_req.username], |_| Ok(true)).optional() {
        Ok(Some(_)) => true,
        Ok(None) => false,
        Err(err) => {
            println!("Error checking username: {}", err);
            return (
                "HTTP/1.1 500 INTERNAL SERVER ERROR",
                r#"{"error": "Database error"}"#.to_string(),
                "application/json",
            );
        }
    };

    if username_exists {
        return (
            "HTTP/1.1 400 BAD REQUEST",
            r#"{"error": "Username already exists"}"#.to_string(),
            "application/json",
        );
    }

    
    match db_handler.register_user(&register_req.username, &register_req.password_hash) {
        Ok(user_id) => (
            "HTTP/1.1 201 CREATED",
            json!({ "user_id": user_id }).to_string(),
            "application/json",
        ),
        Err(err) => {
            println!("Error registering user: {}", err);
            (
                "HTTP/1.1 500 INTERNAL SERVER ERROR",
                r#"{"error": "Failed to register user"}"#.to_string(),
                "application/json",
            )
        }
    }
}