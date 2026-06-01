@echo off
echo ========================================================
echo Memulai Server Lokal untuk Aplikasi SITTA UT...
echo ========================================================
echo Jangan tutup jendela hitam ini selama aplikasi digunakan!
echo.

:: Memeriksa apakah npx tersedia
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js/npx tidak ditemukan di sistem Anda!
    echo Silakan install Node.js terlebih dahulu dari https://nodejs.org
    pause
    exit /b
)

:: Menjalankan server dan membuka browser
start http://localhost:5500
npx -y serve . --listen 5500
