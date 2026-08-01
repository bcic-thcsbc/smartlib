const fs = require("fs");
const path = require("path");

const databasePath =
  process.env.DATABASE_PATH || path.join(__dirname, "..", "database.sqlite");
const schemaPath = path.join(__dirname, "..", "schema.sqlite");

if (!fs.existsSync(databasePath) || fs.statSync(databasePath).size === 0) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  fs.copyFileSync(schemaPath, databasePath);
  console.log(JSON.stringify({ event: "database_initialized_from_schema" }));
}
