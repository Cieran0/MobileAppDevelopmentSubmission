use std::process::Command;
use std::fs;
use std::path::Path;
extern crate pkg_config;


fn main() {
    
    let status_cpp = Command::new("make")
    .current_dir("src/cpp")
    .status()
    .expect("Failed to execute make");

    if !status_cpp.success() {
        panic!("Make command failed with status: {}", status_cpp);
    } else {
        println!("Make finished successfully! {}", status_cpp);
    }

    let libbarbell_path = Path::new("src/cpp/libbarbell.a");
    let destination_barbell_path = Path::new("./libbarbell.a");
    
    if libbarbell_path.exists() {
        fs::rename(libbarbell_path, destination_barbell_path)
            .expect("Failed to move libbarbell.a to the main folder");
    } else {
        panic!("libbarbell.a was not found in the src/cpp directory");
    }

    println!("cargo:rustc-link-search=native=/usr/local/lib"); 
    println!("cargo:rustc-link-search=native=./");
    
    println!("cargo:rustc-link-lib=static=barbell");

    println!("cargo:rustc-link-search=native=/usr/lib64");
    println!("cargo:rustc-link-lib=dylib=raylib");

    println!("cargo:rustc-link-lib=dylib=m");
    println!("cargo:rustc-link-lib=static=stdc++");

    let opencv = pkg_config::Config::new().probe("opencv4").unwrap();

    // Pass the linker flags for OpenCV
    for path in opencv.include_paths {
        println!("cargo:include={}", path.display());
    }
    for lib in opencv.libs {
        println!("cargo:rustc-link-lib={}", lib);
    }
    for path in opencv.link_paths {
        println!("cargo:rustc-link-search=native={}", path.display());
    }

    if cfg!(target_os = "windows") {
        // Windows-specific linking
        println!("cargo:rustc-link-lib=static=msvcrt");
        println!("cargo:rustc-link-search=native=C:/ProgramData/mingw64/mingw64/x86_64-w64-mingw32/lib");
    } else {
        // Linux-specific linking
        println!("cargo:rustc-link-lib=dylib=c");  // Link with libc on Linux
        println!("cargo:rustc-link-search=native=/usr/local/lib"); // Adjust this path if necessary
    }

    // Specify the directory where the .a files are located
    println!("cargo:rustc-link-search=native=libs"); // Adjust path if necessary
    println!("cargo:rustc-link-search=native=./");
}
