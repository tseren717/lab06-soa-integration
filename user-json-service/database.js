const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./profiles.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id       INTEGER PRIMARY KEY,
      name     TEXT,
      email    TEXT,
      bio      TEXT,
      phone    TEXT,
      location TEXT,
      avatar   TEXT
    )
  `);
});
module.exports = db;