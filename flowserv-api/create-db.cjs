const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:admin@localhost:5432/postgres' });
client.connect().then(() => {
  return client.query('CREATE DATABASE flowserv');
}).then(() => {
  console.log('Database flowserv created successfully.');
  process.exit(0);
}).catch(err => {
  if (err.code === '42P04') {
    console.log('Database already exists.');
    process.exit(0);
  } else {
    console.error(err);
    process.exit(1);
  }
});
