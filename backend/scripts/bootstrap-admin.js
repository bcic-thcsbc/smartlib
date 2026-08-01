const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const bcrypt = require('bcrypt');
const initDatabase = require('../database/initDatabase');
const { get, run } = require('../database/db');

async function main() {
  await initDatabase();
  if (await get("SELECT id FROM users WHERE role='admin' LIMIT 1")) throw new Error('An administrator already exists. Bootstrap is one-time only.');
  const terminal = readline.createInterface({ input, output });
  const username = (await terminal.question('Admin username: ')).trim();
  const fullName = (await terminal.question('Admin full name: ')).trim();
  const password = await terminal.question('Admin password (min 12 characters): ');
  terminal.close();
  if (!/^[a-zA-Z0-9._-]{3,64}$/.test(username) || !fullName || password.length < 12) throw new Error('Invalid bootstrap data.');
  if (await get('SELECT id FROM users WHERE username=?',[username])) throw new Error('Username already exists.');
  await run("INSERT INTO users(username,password_hash,full_name,role,status) VALUES(?,? ,?,'admin','active')",[username,await bcrypt.hash(password,12),fullName]);
  console.log('Administrator bootstrap completed.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
