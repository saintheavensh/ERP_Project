const { execSync } = require('child_process');

try {
  console.log('Mencari proses yang menggunakan port 3001...');
  const output = execSync('netstat -ano | findstr :3001').toString();
  const lines = output.trim().split('\n');
  
  if (lines.length > 0 && lines[0].includes('LISTENING')) {
    const parts = lines[0].trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    console.log(`Menemukan PID: ${pid}. Menghentikan proses...`);
    execSync(`taskkill /F /PID ${pid}`);
    console.log('Proses berhasil dihentikan!');
  } else {
    console.log('Tidak ada proses yang berjalan di port 3001.');
  }
} catch (error) {
  console.log('Tidak ada proses yang mengunci port 3001 atau proses sudah terhenti.');
}
