const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter OMDb API Key (or press Enter to skip / use saved): ', (answer) => {
  rl.close();
  const env = { ...process.env };
  const key = answer ? answer.trim() : '';
  if (key) {
    env.EXPO_PUBLIC_OMDB_API_KEY = key;
  }
  const child = spawn('npx', ['expo', 'start', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env,
  });
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
});
