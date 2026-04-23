const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});
// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy-node" });
});

// Get todos
app.get("/todos", (req, res) => {
  db.query("SELECT * FROM todos", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// Add todo
app.post("/todos", (req, res) => {
  const { title, completed } = req.body;
  db.query(
    "INSERT INTO todos (title, completed) VALUES (?, ?)",
    [title, completed],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Todo added (Node)" });
    }
  );
});

app.listen(8002, () => {
  console.log("Node server running on port 8002");
});