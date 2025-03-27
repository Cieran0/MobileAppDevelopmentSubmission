use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct Exercise {
    pub id: u32,
    pub name: String,
    pub body_part: String,
    pub best_set: String
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Set {
    pub reps: u32,
    pub weight: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ExerciseRecord {
    pub exercise_id: u32,
    pub sets: Vec<Set>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Workout {
    pub user_id: String,
    pub start_time: String,
    pub end_time: String,
    pub exercises: Vec<ExerciseRecord>,
    pub(crate) notes: String,
}