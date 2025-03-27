use crate::wt_types::{Set, Workout};
use chrono::{DateTime, Datelike, Duration, Local, NaiveDateTime, TimeZone, Utc};
use rand::Rng;
use rusqlite::{params, Connection, Error, OptionalExtension, Result};
use serde::{Deserialize, Serialize};
use bcrypt::{hash, verify, DEFAULT_COST};

#[derive(Serialize)]
pub struct HistorySet {
    pub reps: String,
    pub weight: String,
}

#[derive(Serialize)]
pub struct HistoryExercise {
    pub name: String,
    pub sets: Vec<HistorySet>,
}

#[derive(Serialize)]
pub struct HistoryData {
    pub date: String,
    pub date_epoch: u64,
    pub duration: String,
    pub prs: u32,
    pub total_volume: u64,
    pub exercises: Vec<HistoryExercise>,
}

pub struct _User {
    pub id: u32,
    pub username: String,
    pub password_hash: String,
}

pub struct Exercise {
    pub id: u32,
    pub _user_id: u32,
    pub name: String,
    pub _description: Option<String>,
    pub muscle_group: String,
    pub best_set: Option<String>,
}

pub struct _DbWorkout {
    pub id: u32,
    pub user_id: u32,
    pub name: Option<String>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub notes: Option<String>,
}

pub struct _WorkoutExercise {
    pub id: u32,
    pub workout_id: u32,
    pub exercise_id: u32,
}

pub struct DatabaseHandler {
    pub conn: Connection,
}

impl DatabaseHandler {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        Ok(DatabaseHandler { conn })
    }

    pub fn _delete_user(&self, user_id: u32) -> Result<()> {
        self.conn
            .execute("DELETE FROM users WHERE id = ?1", params![user_id])?;
        Ok(())
    }

    pub fn add_exercise_to_user(&self, request: ExerciseRequest) -> Result<u32> {

        let user_id = self.get_user_id_from_token(&request.user_id)?;

        self.conn.execute(
            "INSERT INTO user_exercises (user_id, name, muscle_group) VALUES (?1, ?2, ?3)",
            params![user_id, request.name, request.body_part],
        )?;
        let exercise_id = self.conn.last_insert_rowid() as u32;
        Ok(exercise_id)
    }

    pub fn get_user_exercises(&self, user_id: u32) -> Result<Vec<Exercise>> {
        let mut stmt = self.conn.prepare(
            "WITH ranked_sets AS (
                SELECT 
                    user_exercises.id AS ue_id,
                    user_exercises.user_id, 
                    user_exercises.name, 
                    user_exercises.description, 
                    user_exercises.muscle_group,
                    COALESCE(sets.reps, 0) AS reps,
                    COALESCE(sets.weight, 0) AS weight,
                    COALESCE((sets.weight * sets.reps), 0) AS volume,
                    ROW_NUMBER() OVER (
                        PARTITION BY user_exercises.id 
                        ORDER BY (sets.weight * sets.reps) DESC NULLS LAST
                    ) AS rank
                FROM user_exercises
                LEFT JOIN workout_exercises ON user_exercises.id = workout_exercises.exercise_id
                LEFT JOIN sets ON workout_exercises.id = sets.workout_exercise_id
                WHERE user_exercises.user_id = ?1
                )
                SELECT 
                    ue_id, 
                    user_id, 
                    name, 
                    description, 
                    muscle_group, 
                    weight, 
                    reps
                FROM ranked_sets
                WHERE rank = 1;;
                ",)?;

        let exercise_iter = stmt.query_map(params![user_id], |row| {
            Ok(Exercise {
                id: row.get(0)?,
                _user_id: row.get(1)?,
                name: row.get(2)?,
                _description: row.get(3)?,
                muscle_group: row.get(4)?,
                best_set: {
                    let weight: Option<f64> = row.get(5).ok();
                    let reps: Option<u32> = row.get(6).ok();
                    if let (Some(w), Some(r)) = (weight, reps) {
                        let bs = format!("{} x {}kg", r, w);
                        Some(bs)
                    } else {
                        None
                    }
                },
            })
        })?;

        let mut exercises = Vec::new();
        for exercise in exercise_iter {
            exercises.push(exercise?);
        }
        Ok(exercises)
    }

    pub fn is_valid_user(&self, user_id: u32) -> Result<u32> {
        let mut stmt = self.conn.prepare("SELECT id FROM users WHERE id = ?1")?;

        let mut rows = stmt.query(params![user_id])?;

        if let Some(_row) = rows.next()? {
            Ok(user_id)
        } else {
            Err(Error::QueryReturnedNoRows)
        }
    }

    pub fn save_workout(&self, workout: Workout, user_id: u32) -> Result<u32> {
        
        self.conn.execute(
            "INSERT INTO workouts (user_id, start_time, end_time, notes, prs) VALUES (?1, ?2, ?3, ?4, 0)",
            params![
                user_id,
                workout.start_time,
                workout.end_time,
                "",
            ],
        )?;
        let workout_id = self.conn.last_insert_rowid() as u32;

        
        let mut workout_exercise_ids = Vec::new(); 

        for exercise in &workout.exercises {
            
            self.conn.execute(
                "INSERT INTO workout_exercises (workout_id, exercise_id) VALUES (?1, ?2)",
                params![workout_id, exercise.exercise_id],
            )?;
            let workout_exercise_id = self.conn.last_insert_rowid() as u32;
            workout_exercise_ids.push(workout_exercise_id);
        }

        
        let mut total_sets_saved = 0; 

        for (exercise, workout_exercise_id) in
            workout.exercises.iter().zip(workout_exercise_ids.iter())
        {
            for (set_index, set) in exercise.sets.iter().enumerate() {
                
                self.conn.execute(
                    "INSERT INTO sets (workout_exercise_id, set_number, weight, reps) VALUES (?1, ?2, ?3, ?4)",
                    params![
                        workout_exercise_id, 
                        set_index + 1,       
                        set.weight,          
                        set.reps,            
                    ],
                )?;
                total_sets_saved += 1; 
            }
        }

        
        Ok(total_sets_saved)
    }

    pub fn get_history_data(&self, user_id: u32) -> Result<Vec<HistoryData>> {
        
        let mut stmt = self.conn.prepare(
            "SELECT id, start_time, end_time, prs FROM workouts WHERE user_id = ?1 ORDER BY start_time DESC"
        )?;
        let workout_iter = stmt.query_map(params![user_id], |row| {
            Ok(WorkoutRow {
                workout_id: row.get(0)?,
                start_time: row.get(1)?,
                end_time: row.get(2)?,
                prs: row.get(3)?,
            })
        })?;

        let mut history_vec = Vec::new();
        for workout_res in workout_iter {
            let workout = workout_res?;

            println!("Started {}, Ended {}", workout.start_time, workout.end_time);

            
            let duration = compute_duration(&workout.start_time, &workout.end_time)
                .unwrap_or_else(|| "Unknown".to_string());

            
            
            let date_dt = parse_as_date_time_utc(&workout.start_time);
            let date = date_dt.format("%A, %d %b").to_string();
            let date_epoch = date_dt.timestamp() as u64;

            
            let mut stmt_ex = self.conn.prepare(
                "SELECT we.id, ue.name 
                 FROM workout_exercises we 
                 JOIN user_exercises ue ON we.exercise_id = ue.id 
                 WHERE we.workout_id = ?1",
            )?;
            let exercise_iter = stmt_ex.query_map(params![workout.workout_id], |row| {
                Ok(ExerciseRow {
                    workout_exercise_id: row.get(0)?,
                    name: row.get(1)?,
                })
            })?;

            let mut history_exercises = Vec::new();
            let mut workout_total_volume: u64 = 0;

            for ex_res in exercise_iter {
                let ex = ex_res?;
                
                let mut stmt_set = self.conn.prepare(
                    "SELECT set_number, weight, reps 
                     FROM sets 
                     WHERE workout_exercise_id = ?1 
                     ORDER BY set_number ASC",
                )?;
                let set_iter = stmt_set.query_map(params![ex.workout_exercise_id], |row| {
                    Ok(HistorySet {
                        
                        
                        reps: row.get::<_, u32>(2)?.to_string(),
                        weight: row.get::<_, f64>(1)?.to_string(),
                    })
                })?;

                let mut history_sets = Vec::new();
                for set_res in set_iter {
                    let hs = set_res?;
                    
                    let weight: f64 = hs.weight.parse().unwrap_or(0.0);
                    let reps: u32 = hs.reps.parse().unwrap_or(0);
                    workout_total_volume += (weight * reps as f64) as u64;
                    history_sets.push(hs);
                }

                history_exercises.push(HistoryExercise {
                    name: ex.name,
                    sets: history_sets,
                });
            }

            history_vec.push(HistoryData {
                date,
                date_epoch,
                duration,
                prs: workout.prs,
                total_volume: workout_total_volume,
                exercises: history_exercises,
            });
        }

        Ok(history_vec)
    }

    pub fn get_workouts_per_week(&self, user_id: u32) -> Result<WorkoutsPerWeek> {
        let now = Local::now();
        let mut week_starts = Vec::new();

        
        for i in (0..8).rev() {
            let start_of_week = now.date_naive() - Duration::weeks(i);
            let start_of_week = start_of_week
                - Duration::days(start_of_week.weekday().num_days_from_monday() as i64);
            week_starts.push(start_of_week);
        }

        let mut workout_counts = vec![0; 8];

        for (i, week_start) in week_starts.iter().enumerate() {
            let week_end = *week_start + Duration::days(7);

            let start_of_week_str = week_start.format("%Y-%m-%d").to_string();
            let end_of_week_str = week_end.format("%Y-%m-%d").to_string();

            println!("Start {} End {}", start_of_week_str, end_of_week_str);

            let mut stmt = self.conn.prepare(
                "SELECT COUNT(*) FROM workouts 
                 WHERE user_id = ?1 
                 AND start_time >= ?2 
                 AND start_time < ?3",
            )?;

            let count: u32 = stmt.query_row(
                params![user_id, start_of_week_str, end_of_week_str],
                |row| row.get(0),
            )?;

            workout_counts[i] = count;
        }

        let labels: Vec<String> = week_starts
            .iter()
            .map(|date| format!("{}/{}", date.day(), date.month()))
            .collect();

        Ok(WorkoutsPerWeek {
            labels,
            data: workout_counts,
        })
    }

    pub fn get_1_rep_maxes(&self, user_id: u32, exercise_id: u32) -> Result<OneRepMaxes> {
        let now = Local::now();
        let mut month_starts = Vec::new();

        
        for i in (0..8).rev() {
            
            let month_start = if now.month() as i32 - i < 1 {
                
                let adjusted_month = now.month() as i32 - i + 12; 
                let final_month = if adjusted_month <= 12 {
                    adjusted_month
                } else {
                    adjusted_month - 12
                };
                let adjusted_year = if adjusted_month <= 12 {
                    now.year() - 1
                } else {
                    now.year()
                };

                now.with_month(final_month as u32)
                    .unwrap()
                    .with_year(adjusted_year)
                    .unwrap()
                    .with_day(1)
                    .unwrap()
            } else {
                now.with_month(now.month() - i as u32)
                    .unwrap()
                    .with_day(1)
                    .unwrap()
            };

            month_starts.push(month_start);
        }

        let mut highest_weights = vec![0.0; 8]; 
        let mut previous_max_weight = 0.0; 

        
        for (i, month_start) in month_starts.iter().enumerate() {
            
            let month_end = if month_start.month() == 12 {
                Local.with_ymd_and_hms(month_start.year() + 1, 1, 1, 0, 0, 0).single()
            } else {
                Local.with_ymd_and_hms(month_start.year(), month_start.month() + 1, 1,0,0,0).single()
            };

            let month_end = match month_end {
                Some(dt) => dt,
                None => {
                    println!("Error: Could not calculate month_end");
                    return Err(rusqlite::Error::QueryReturnedNoRows);
                }
            };

            let start_of_month_str = month_start.format("%Y-%m-%d").to_string();
            let end_of_month_str = month_end.format("%Y-%m-%d").to_string();

            let query = "SELECT MAX(weight) 
                     FROM sets 
                     JOIN workout_exercises we ON sets.workout_exercise_id = we.id
                     JOIN workouts w ON we.workout_id = w.id
                     WHERE we.exercise_id = ?1 
                     AND w.user_id = ?2
                     AND w.start_time >= ?3 
                     AND w.start_time < ?4";

            
            let mut stmt_sets = self.conn.prepare(query)?;

            println!("Executing SQL query:\n{}", query);
            println!("With parameters: exercise_id = {}, user_id = {}, start_of_month = {}, end_of_month = {}", 
                 exercise_id, user_id, start_of_month_str, end_of_month_str);

            
            let current_month_max_weight: f64 = stmt_sets
                .query_row(
                    params![exercise_id, user_id, start_of_month_str, end_of_month_str],
                    |row| row.get(0),
                )
                .unwrap_or(0.0);

            
            if current_month_max_weight > previous_max_weight {
                highest_weights[i] = current_month_max_weight;
                previous_max_weight = current_month_max_weight; 
            } else {
                highest_weights[i] = previous_max_weight; 
            }
        }

        
        let labels: Vec<String> = month_starts
            .iter()
            .map(|date| date.format("%b").to_string()) 
            .collect();

        Ok(OneRepMaxes {
            labels,
            data: highest_weights.into_iter().collect(), 
        })
    }

    pub fn get_previous_sets(&self, user_id: u32, exercise_id: u32) -> Result<Vec<Set>> {
        let query = "
            WITH subquery AS (
                SELECT w.start_time, s.reps, s.weight
                FROM workouts w
                JOIN workout_exercises we ON w.id = we.workout_id
                JOIN sets s ON we.id = s.workout_exercise_id
                WHERE w.user_id = ? AND we.exercise_id = ?
                ORDER BY w.start_time DESC
            ) 
            SELECT reps, weight
            FROM subquery
            WHERE start_time = (SELECT MAX(start_time) FROM subquery);
        ";

        let mut stmt = self.conn.prepare(query)?;
        let sets = stmt
            .query_map(params![user_id, exercise_id], |row| {
                Ok(Set {
                    reps: row.get(0)?,
                    weight: row.get(1)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(sets)
    }

    pub fn get_templates(&self, user_id: u32) -> Result<Vec<Template>> {
        let query = "
            SELECT 
                t.id AS template_id,
                t.name AS template_name,
                t.created_at,
                te.exercise_id,
                ue.name AS exercise_name,
                ue.muscle_group,
                te.sets
            FROM templates t
            LEFT JOIN template_exercises te ON t.id = te.template_id
            LEFT JOIN user_exercises ue ON te.exercise_id = ue.id
            WHERE t.user_id = ?1
            ORDER BY t.id, te.id
        ";
        
        let mut stmt = self.conn.prepare(query)?;
        let template_iter = stmt.query_map(params![user_id], |row| {
            Ok(TemplateRow {
                template_id: row.get(0)?,
                template_name: row.get(1)?,
                created_at: row.get(2)?,
                exercise_id: row.get(3)?,
                exercise_name: row.get(4)?,
                muscle_group: row.get(5)?,
                sets: row.get(6)?,
            })
        })?;
    
        let mut templates: Vec<Template> = Vec::new();
        let mut current_template: Option<Template> = None;
    
        for row_result in template_iter {
            let row = row_result?;
    
            match current_template.as_mut() {
                Some(template) if template.id == row.template_id => {
                    
                    if let (Some(ex_id), Some(ex_name), Some(muscle)) = (
                        row.exercise_id,
                        row.exercise_name,
                        row.muscle_group,
                    ) {
                        template.exercises.push(TemplateExercise {
                            exercise_id: ex_id,
                            name: ex_name,
                            muscle_group: muscle,
                            sets: row.sets,
                        });
                    }
                }
                _ => {
                    
                    if let Some(existing_template) = current_template.take() {
                        templates.push(existing_template);
                    }
    
                    let mut new_template = Template {
                        id: row.template_id,
                        name: row.template_name.clone(),
                        created_at: row.created_at.clone(),
                        exercises: Vec::new(),
                    };
    
                    
                    if let (Some(ex_id), Some(ex_name), Some(muscle)) = (
                        row.exercise_id,
                        row.exercise_name,
                        row.muscle_group,
                    ) {
                        new_template.exercises.push(TemplateExercise {
                            exercise_id: ex_id,
                            name: ex_name,
                            muscle_group: muscle,
                            sets: row.sets,
                        });
                    }
    
                    current_template = Some(new_template);
                }
            }
        }
    
        
        if let Some(template) = current_template {
            templates.push(template);
        }
    
        Ok(templates)
    }

    pub fn save_template(&self, request: TemplateRequest) -> Result<u32> {

        let user_id = self.get_user_id_from_token(&request.user_id)?;

        
        self.conn.execute(
            "INSERT INTO templates (user_id, name, created_at) VALUES (?1, ?2, datetime('now'))",
            params![user_id, request.name],
        )?;
        let template_id = self.conn.last_insert_rowid() as u32;

        
        for exercise in request.exercises {
            self.conn.execute(
                "INSERT INTO template_exercises (template_id, exercise_id, sets) VALUES (?1, ?2, ?3)",
                params![template_id, exercise.exercise_id, exercise.sets],
            )?;
        }

        
        Ok(template_id)
    }

    pub fn get_user_id_from_token(&self, token: &str) -> Result<u32> {
        let query = "
            SELECT user_id 
            FROM sessions 
            WHERE session_token = ?1 
              AND expires_at > CURRENT_TIMESTAMP
        ";
        
        let mut stmt = self.conn.prepare(query)?;
        let user_id = stmt.query_row(params![token], |row| {
            row.get(0)
        })?;
        
        Ok(user_id)
    }

    pub fn register_user(&self, username: &str, password: &str) -> Result<u32> {
        
        let hashed_password = hash(password, DEFAULT_COST);

        match hashed_password {
            Err(_) => {
                    return Err(rusqlite::Error::QueryReturnedNoRows);
                    }
            Ok(_) => {}
        }

        
        self.conn.execute(
            "INSERT INTO users (username, password_hash) VALUES (?1, ?2)",
            params![username, hashed_password.unwrap()],
        )?;

        
        let user_id = self.conn.last_insert_rowid() as u32;
        Ok(user_id)
    }

    pub fn login(&self, username: &str, password: &str) -> Result<String> {
        
        let mut stmt = self.conn.prepare(
            "SELECT id, password_hash FROM users WHERE username = ?1",
        )?;
        let user_result: Option<(u32, String)> = stmt
            .query_row(params![username], |row| Ok((row.get(0)?, row.get(1)?)))
            .optional()?;

        let (user_id, stored_password_hash) = match user_result {
            Some(result) => result,
            None => return Err(rusqlite::Error::QueryReturnedNoRows),
        };

        println!("Hash {}, New {}", stored_password_hash, password);

        let valid = verify(password, &stored_password_hash);

        match valid {
            Ok(correct) => {
                if !correct {
                    return Err(rusqlite::Error::QueryReturnedNoRows);
                }
            }
            Err(_) => {
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }
        }

        
        let session_token: String = (0..32)
            .map(|_| rand::thread_rng().gen_range(b'a'..=b'z') as char)
            .collect();

        
        let expires_at = Utc::now() + Duration::hours(24); 
        let expires_at_formatted = expires_at.format("%Y-%m-%d %H:%M:%S").to_string(); 

        
        self.conn.execute(
            "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?1, ?2, ?3)",
            params![user_id, session_token.clone(), expires_at_formatted],
        )?;

        
        Ok(session_token)
    }
}

struct WorkoutRow {
    workout_id: u32,
    start_time: String,
    end_time: String,
    prs: u32,
}

struct TemplateRow {
    template_id: u32,
    template_name: String,
    created_at: String,
    exercise_id: Option<u32>,
    exercise_name: Option<String>,
    muscle_group: Option<String>,
    sets: u32,
}

#[derive(Debug, Serialize)]
pub struct Template {
    pub id: u32,
    pub name: String,
    pub created_at: String,
    pub exercises: Vec<TemplateExercise>,
}

#[derive(Debug, Serialize)]
pub struct TemplateExercise {
    pub exercise_id: u32,
    pub name: String,
    pub muscle_group: String,
    pub sets: u32,
}


struct ExerciseRow {
    workout_exercise_id: u32,
    name: String,
}

#[derive(Serialize)]
pub struct WorkoutsPerWeek {
    labels: Vec<String>,
    data: Vec<u32>,
}

#[derive(Serialize)]
pub struct OneRepMaxes {
    labels: Vec<String>,
    data: Vec<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct ExerciseRequest {
    pub user_id: String,
    pub name: String,
    pub body_part: String,
}

pub fn parse_as_date_time_utc(datetime_str: &str) -> DateTime<Utc> {
    let naive_dt = NaiveDateTime::parse_from_str(datetime_str, "%Y-%m-%d %H:%M:%S").unwrap();

    let datetime_utc: DateTime<Utc> = Utc.from_utc_datetime(&naive_dt);

    return datetime_utc;
}


fn compute_duration(start_time: &str, end_time: &str) -> Option<String> {
    
    let start: DateTime<Utc> = parse_as_date_time_utc(start_time);
    let end: DateTime<Utc> = parse_as_date_time_utc(end_time);
    let duration = end.signed_duration_since(start);
    let hours = duration.num_hours();
    let minutes = (duration.num_minutes() % 60).abs();
    Some(format!("{}h {}m", hours, minutes))
}


#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateRequest {
    pub user_id: String,
    pub name: String,
    pub exercises: Vec<TemplateExerciseRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateExerciseRequest {
    pub exercise_id: u32,
    pub sets: u32,
}