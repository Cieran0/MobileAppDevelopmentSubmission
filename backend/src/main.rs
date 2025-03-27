use std::{
    collections::HashMap,
    fs::{self, remove_file},
    io::{prelude::*, BufReader},
    net::TcpListener,
    sync::{Arc, Mutex}, thread, time::{Duration, SystemTime},
};

mod tracker;
mod routes;
mod database_handler;
use database_handler::DatabaseHandler;
mod wt_types;
mod tests;

use openssl::ssl::{SslMethod, SslAcceptor, SslFiletype};

fn main() {
    
    let db_handler = Arc::new(Mutex::new(
        DatabaseHandler::new("workout_tracker.db")
            .expect("Failed to open database")
    ));

    let mut acceptor_builder = SslAcceptor::mozilla_intermediate(SslMethod::tls())
        .expect("Failed to create SSL Acceptor");
    acceptor_builder
        .set_private_key_file("ssl/server.key", SslFiletype::PEM)
        .expect("Failed to set private key");
    acceptor_builder
        .set_certificate_chain_file("ssl/server.crt")
        .expect("Failed to set certificate chain");
    let acceptor = acceptor_builder.build();

    let listener = TcpListener::bind("0.0.0.0:25561").unwrap();

    fs::create_dir_all("./uploads").expect("Failed to create upload directory");
    fs::create_dir_all("./processed").expect("Failed to create upload directory");

    thread::spawn(|| {
        loop {
            cleanup_old_files();
            thread::sleep(Duration::from_secs(600));
        }
    });

    for stream in listener.incoming() {
        let stream = stream.unwrap();
        let acceptor = acceptor.clone();
        let db_handler = Arc::clone(&db_handler);
        std::thread::spawn(move || {
            
            let ssl_stream = match acceptor.accept(stream) {
                Ok(ssl_stream) => ssl_stream,
                Err(e) => {
                    eprintln!("Failed to establish TLS connection: {:?}", e);
                    return;
                }
            };
    
            handle_connection(ssl_stream, &db_handler);
        });
    }
}


fn handle_connection<T: Read + Write>(mut stream: T, db_handler: &Arc<Mutex<DatabaseHandler>>) {
    println!("New connection");

    
    let mut buf_reader = BufReader::new(&mut stream);
    let mut request_content = Vec::new();
    let mut content_length: usize = 0;
    let mut content_type: Option<String> = None;

    
    for line in buf_reader.by_ref().lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => break,
        };
        if line.is_empty() {
            break;
        }
        if let Some(len) = line.strip_prefix("Content-Length: ") {
            content_length = len.parse::<usize>().unwrap_or(0);
        }
        if let Some(ct) = line.strip_prefix("Content-Type: ") {
            content_type = Some(ct.to_string());
        }
        request_content.push(line);
    }

    let request_line = request_content.get(0).unwrap_or(&"".to_string()).clone();
    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 3 {
        let response =
            build_response("HTTP/1.1 400 BAD REQUEST", "400 BAD REQUEST", "text/html");
        stream.write_all(response.as_bytes()).unwrap();
        return;
    }

    let path_with_query = parts[1];
    let path_parts: Vec<&str> = path_with_query.splitn(2, '?').collect();
    let path = path_parts[0];
    let query_string = if path_parts.len() > 1 { path_parts[1] } else { "" };

    println!("Path: {}", path);

    if path.starts_with("/processed/") {
        println!("Trying to download video!");
        let file_path = format!("./processed/{}", path.trim_start_matches("/processed/"));
        match fs::read(&file_path) {
            Ok(bytes) => {
                let mime_type = if file_path.ends_with(".mp4") {
                    "video/mp4"
                } else {
                    "application/octet-stream"
                };
                let response = format!(
                    "HTTP/1.1 200 OK\r\n\
                     Access-Control-Allow-Origin: *\r\n\
                     Content-Type: {}\r\n\
                     Content-Length: {}\r\n\r\n",
                    mime_type,
                    bytes.len()
                );
                stream.write_all(response.as_bytes()).unwrap();
                stream.write_all(&bytes).unwrap();

                let _ = remove_file(file_path);
                return;
            }
            Err(_) => {
                let response = build_response(
                    "HTTP/1.1 404 NOT FOUND",
                    "404 NOT FOUND",
                    "text/html",
                );
                stream.write_all(response.as_bytes()).unwrap();
                return;
            }
        }
    }

    let query_params: HashMap<_, _> = query_string
        .split('&')
        .filter_map(|s: &str| {
            let mut kv = s.splitn(2, '=');
            Some((kv.next()?.to_string(), kv.next().unwrap_or("").to_string()))
        })
        .collect();

    
    let mut db = db_handler.lock().unwrap();

    
    
    let (status_line, contents, content_type) = match path {
        "/exercises" => routes::handle_exercises_route(query_params, &mut db),
        "/login" => routes::handle_login_route(buf_reader, &mut db, content_length),
        "/register" => routes::handle_register_route(buf_reader, &mut db, content_length),
        "/history" => routes::handle_history_route(query_params, &mut db),
        "/workouts_per_week" => routes::handle_workouts_per_week_route(query_params, &mut db),
        "/previous_sets" => routes::handle_previous_sets_route(query_params, &mut db),
        "/one_rep_max" => routes::handle_one_rep_max_route(query_params, &mut db),
        "/templates" => routes::handle_templates_route(query_params, &mut db),
        "/save_template" => routes::handle_save_template_route(buf_reader, &mut db, content_length),
        "/workout" => routes::handle_workout_route(buf_reader, query_params, &mut db, content_length),
        "/add_exercise" => routes::handle_add_exercise_route(buf_reader, &mut db, content_length),
        "/upload/metadata" => routes::handle_metadata_upload(buf_reader, content_length),
        "/upload/video" => {
            if let Some(ct) = content_type {
                routes::handle_video_upload(buf_reader, content_length, ct)
            } else {
                ("HTTP/1.1 400 BAD REQUEST", "Missing Content-Type".to_string(), "text/html")
            }
        }
        
        _ => (
            "HTTP/1.1 404 NOT FOUND",
            "<html><body>404 NOT FOUND</body></html>".to_string(),
            "text/html",
        ),
    };

    if status_line.is_empty() && contents.is_empty() && content_type.is_empty() {
        return;
    }

    let response = build_response(status_line, &contents, content_type);
    stream.write_all(response.as_bytes()).unwrap();
}

fn build_response(status: &str, body: &str, content_type: &str) -> String {
    format!(
        "{status}\r\n\
         Access-Control-Allow-Origin: *\r\n\
         Content-Type: {content_type}\r\n\
         Content-Length: {}\r\n\r\n{body}",
        body.len()
    )
}

fn cleanup_old_files() {
    const MAX_AGE: Duration = Duration::from_secs(3600);
    let dirs = ["./processed", "./uploads"];
    let now = SystemTime::now();

    for dir in dirs {
        if let Err(e) = cleanup_directory(dir, now, MAX_AGE) {
            eprintln!("Directory cleanup failed for {}: {}", dir, e);
        }
    }
}

fn cleanup_directory(dir: &str, now: SystemTime, max_age: Duration) -> Result<(), std::io::Error> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let metadata = entry.metadata()?;
        
        if !metadata.is_file() {
            continue;
        }

        let modified = metadata.modified()?;
        let age = now.duration_since(modified).unwrap_or_default();

        if age > max_age {
            if let Err(e) = fs::remove_file(entry.path()) {
                eprintln!("Failed to delete {}: {}", entry.path().display(), e);
            }
        }
    }
    Ok(())
}