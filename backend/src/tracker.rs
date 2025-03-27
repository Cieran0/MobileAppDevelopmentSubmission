use std::fs::remove_file;
use std::path::Path;
use std::process::Command;
use std::io;
use serde::Deserialize;
use serde_json;

#[derive(Deserialize, Debug, Clone)]
pub struct Metadata {
    pub start_time: f64,
    pub end_time: f64,
    pub barbell_area: BarbellArea,
    pub video_url: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct BarbellArea {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[repr(C)]
pub struct ProcessedVideo {
    pub succeeded: i32,
    pub averages: [f64; 6],
    pub new_path: [i8; 256],
}

pub struct ProcessedVideoR {
    pub _succeeded: i32,
    pub averages: [f64; 6],
    pub new_path: String
}

#[derive(Debug)]
pub enum TrackerError {
    Failed,
}

extern "C" {
    pub fn process_bar_path(
        input_path: *const u8,
        output_path: *const u8,
        b_x: i32,
        b_y: i32,
        b_width: i32,
        b_height: i32,
    ) -> ProcessedVideo;
}

pub fn extract_meta_data(json: String) -> Metadata {
    serde_json::from_str(json.as_str()).unwrap()
}


pub fn track_video(input_path: String, output_path: String, x: i32, y: i32, width: i32, height: i32) -> Result<ProcessedVideoR, TrackerError> {
    
    let mut bp: Vec<u8> = output_path.clone().into_bytes();
    bp.push(0);
    let mut ip: Vec<u8> = input_path.clone().into_bytes();
    ip.push(0);
    
    let result = unsafe {
        process_bar_path(
            ip.as_ptr(),
            bp.as_ptr(),
            x,
            y,
            width,
            height,
        )
    };

    let _ = remove_file(input_path);


    if result.succeeded != 0 {
        for average in result.averages  {
            println!("Average {}", average);
        }
        return Ok(ProcessedVideoR { _succeeded: result.succeeded, averages: result.averages, new_path: output_path });

    }

    Err(TrackerError::Failed)
}

fn add_edited_suffix(path: &str) -> String {
    let original_path = Path::new(path);
    
    let parent = original_path.parent().unwrap_or(Path::new(""));
    let file_name = original_path.file_stem().unwrap();
    
    let new_file_name = format!("{}-edited.mp4", file_name.to_string_lossy());
    
    let new_path = parent.join(new_file_name);
    
    
    new_path.to_string_lossy().to_string()
}

pub fn edit(md: Metadata) -> io::Result<String> {
    let duration = md.end_time - md.start_time;
    let output_video_path = add_edited_suffix(&md.video_url.clone());

    
    let command = Command::new("ffmpeg")
        .arg("-i")
        .arg(md.video_url.clone())
        .arg("-ss")
        .arg(md.start_time.to_string())  
        .arg("-t")
        .arg(duration.to_string())  
        .arg("-c:v")
        .arg("libx264")  
        .arg("-c:a")
        .arg("aac")  
        .arg("-strict")
        .arg("experimental")  
        .arg(output_video_path.clone())  
        .output()  
        .expect("Failed to execute FFmpeg command");

    let _ = remove_file(md.video_url);

    if !command.status.success() {
        eprintln!("FFmpeg command failed: {}", String::from_utf8_lossy(&command.stderr));
        return Err(io::Error::new(io::ErrorKind::Other, "FFmpeg command failed"));
    }

    Ok(output_video_path)
}