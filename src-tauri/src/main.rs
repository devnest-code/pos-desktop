// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::State;

// Estado global para el proceso del POS
struct POSState {
    process: Mutex<Option<Child>>,
}

// Comando para iniciar el servidor POS
#[tauri::command]
async fn start_pos_server(state: State<'_, POSState>) -> Result<String, String> {
    let mut process_guard = state.process.lock().unwrap();

    // Si ya hay un proceso corriendo, no iniciar otro
    if process_guard.is_some() {
        return Err("El servidor POS ya está en ejecución".to_string());
    }

    // Determinar el directorio del POS (relativo al ejecutable)
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Error obteniendo directorio: {}", e))?
        .parent()
        .ok_or("Error obteniendo carpeta padre")?
        .to_path_buf();

    let pos_dir = exe_dir.join("pos");

    // Verificar que existe el directorio
    if !pos_dir.exists() {
        return Err(format!(
            "No se encontró el directorio del POS en: {}",
            pos_dir.display()
        ));
    }

    // Iniciar el servidor con npm
    #[cfg(target_os = "windows")]
    let child = Command::new("cmd")
        .args(["/C", "npm", "start"])
        .current_dir(&pos_dir)
        .spawn()
        .map_err(|e| format!("Error iniciando POS: {}", e))?;

    #[cfg(not(target_os = "windows"))]
    let child = Command::new("npm")
        .arg("start")
        .current_dir(&pos_dir)
        .spawn()
        .map_err(|e| format!("Error iniciando POS: {}", e))?;

    *process_guard = Some(child);

    Ok("Servidor POS iniciado correctamente".to_string())
}

// Comando para detener el servidor POS
#[tauri::command]
async fn stop_pos_server(state: State<'_, POSState>) -> Result<String, String> {
    let mut process_guard = state.process.lock().unwrap();

    if let Some(mut child) = process_guard.take() {
        child
            .kill()
            .map_err(|e| format!("Error deteniendo POS: {}", e))?;

        Ok("Servidor POS detenido correctamente".to_string())
    } else {
        Err("No hay ningún servidor POS en ejecución".to_string())
    }
}

// Comando para verificar estado del POS
#[tauri::command]
async fn check_pos_status(state: State<'_, POSState>) -> Result<bool, String> {
    let process_guard = state.process.lock().unwrap();
    Ok(process_guard.is_some())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .manage(POSState {
            process: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            start_pos_server,
            stop_pos_server,
            check_pos_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
