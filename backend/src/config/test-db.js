const pool = require("./db");

async function test() {
  const [rows] = await pool.query("SELECT * FROM Users");
  console.log(rows);
}

test();