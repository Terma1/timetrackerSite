use std::{fs, path};
use actix_web::{web, App, HttpServer, HttpResponse, get, HttpRequest, middleware, Error, delete};
use actix_web_httpauth::{extractors::basic::BasicAuth, middleware::HttpAuthentication};
use actix_web_httpauth::extractors::{AuthenticationError, basic};
use actix_cors::Cors;
use actix_web::dev::{ServiceRequest};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Subject {
    name: String,
    semester: String,
    timetracks: Vec<Timetrack>,
    actual_minutes: i64,
    expected_hours: String,
    identifier: String,
    timestamp: i64,
    last_edited: i64
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Timetrack {
    start_date: String,
    end_date: String,
    pause_duration: i64,
    id: i32
}
#[derive(Debug, Serialize, Deserialize)]
struct Backup {
    time: String,
    subjects: Vec<Subject>
}

#[derive(Debug, Serialize, Deserialize)]
struct BackupsList {
    backups: Vec<Backup>
}

impl BackupsList {
    fn add_backup_to_list (&mut self, backup: Backup) {
        self.backups.push(backup)
    }
}

//get @ /backup returns the list of backups as object
//post @ /backup adds new backup in the directory
//get @ / checks the connection with the server
//get @ /backup/{backup_name.json} returns backup_name.json as backup-object

fn get_backups_as_object() -> Option<BackupsList> {
    let directory= path::Path::new("./backup");
    let mut list = BackupsList {
        backups: vec![]
    };
    let exists = path::Path::new(directory).exists();
    if exists {
        //path exists
        let read_dir = fs::read_dir(directory).unwrap();
        let number_of_elements_in_dir = read_dir.count();
        if number_of_elements_in_dir == 0 {
            //no files in the directory
            None
        }
        else {
            for path in  fs::read_dir(directory).unwrap() {
                //current path as string
                let curr = path.unwrap().path().display().to_string();
                //get content of current json file as string
                let content = fs::read_to_string(&curr).expect("ERROR");
                //convert json content in object
                let backup: Backup = serde_json::from_str(&content).unwrap();
                //add current backup to backupslist
                list.add_backup_to_list(backup);
            }
            //return backupslist
            Some(list)
        }

    }
    else {
        None
    }

}

#[get("/")]
async fn check_connection() -> HttpResponse {
    HttpResponse::Ok().json("Connection established!".to_string())
}

#[get("/backup")]
async fn return_list_of_backups() -> HttpResponse {
    let backups_list = get_backups_as_object();
    if let Some(val) = backups_list {
        HttpResponse::Ok().json(val)
    }
    else {
        HttpResponse::NoContent().body("directory /backup is not available")
    }
}

//#[get("/backup/{json_file}")]
async fn return_backup(json_file: web::Path<String>) -> HttpResponse {
    let path = format!("backup/{json_file}");
    let content = fs::read_to_string(&path).expect("ERROR");
    let backup: Backup = serde_json::from_str(&content).expect("ERROR"); //todo: Errors genauer beschrreiben

    HttpResponse::Ok().json(backup)

}

async fn download_backup(json_file: web::Path<String>) -> HttpResponse {
    let path = format!("backup/{json_file}");
    let file = fs::read(&path).expect("Error");

    HttpResponse::Ok()
        .insert_header(("Content-Disposition", "attachment; name=\"Backup\"; filename=\"backup.json\""))
        .content_type("application/json")
        .body(file)
}


//#[post("backup/")]
async fn accept_backup(sub: web::Json<Backup>, req: HttpRequest) -> HttpResponse {
    //accept object an save it
    let new_sub = sub.0;

    //save the object in the local storage as json file
    let json = serde_json::to_string(&new_sub).unwrap().to_string();
    let new_sub_name = &new_sub.time;

    let directory= path::Path::new("./backup");

    let exists = path::Path::new(directory).exists();
    //check if directory in which we want to save backup exists
    if !exists {
        //create new directory
        fs::create_dir(directory).expect("ERROR when creating directory");
    }
    let directory_as_string = directory.display().to_string();
    let filepath = format!("{directory_as_string}/{new_sub_name}.json");
    fs::write(filepath, json).expect("ERROR when writing backup as file");

    HttpResponse::Ok().json("New Backup added to backup database".to_string())

}

#[delete("/backup/{json_file}")]
async fn delete_backup(json_file: web::Path<String>) -> HttpResponse {
    let path = format!("backup/{json_file}");
    fs::remove_file(path).expect("ERROR");
    HttpResponse::Ok()
        .json("Backup deleted".to_string())
}

async fn validator(req: ServiceRequest, credentials: BasicAuth) -> Result<ServiceRequest, (Error, ServiceRequest)> {
    let username = credentials.user_id().to_string();
    let password = credentials.password().unwrap();

    if password.eq("thws") && username.eq("student") {
        Ok(req)
        //return message
    }
    else {
        let config = req.app_data::<basic::Config>()
            .cloned()
            .unwrap_or_default();
        // .scope("urn:example:channel=HBO&urn:example:rating=G,PG-13");

        Err((AuthenticationError::from(config).into(), req))
    }
}




#[actix_web::main]
async fn main() -> std::io::Result<()> {

    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    log::info!("starting HTTP server at http://localhost:8081");

    HttpServer::new(|| {
        let auth = HttpAuthentication::basic(validator);

        App::new()
            .wrap(auth)
            .wrap(middleware::Logger::default())
            .wrap(Cors::permissive().allow_any_method())
            .service(check_connection)
            .service(return_list_of_backups)
            .service(delete_backup)
            .service(
                web::resource("/backup/{json_file}")
                    .route(web::get().to(return_backup))
            )

            .service(
                web::resource("/backup") // <- limit size of the payload (resource level)
                    .route(web::post().to(accept_backup))
            )


    })
        .bind(("127.0.0.1", 8081))?
        .run()
        .await
}