@echo off
echo ========================================================
echo Memulai Proses Hosting ke Vercel...
echo ========================================================
echo Pastikan Anda memiliki koneksi internet.
echo.
echo Jika diminta untuk login, browser Anda akan terbuka secara otomatis.
echo Silakan login menggunakan akun GitHub/Vercel Anda.
echo.
echo Ikuti petunjuk di layar (tekan tombol "Enter" berulang kali untuk
echo memilih opsi bawaan/default hingga proses selesai).
echo ========================================================
echo.

call npx -y vercel

echo.
echo ========================================================
echo Jika berhasil, link aplikasi Anda akan muncul di atas (Production).
echo ========================================================
pause
