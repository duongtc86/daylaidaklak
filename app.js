const http = require("http");
const express = require("express");
const app = express();

const fs = require("fs");
const path = require("path");
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("dist"));
app.set("views", "./dist");
app.set("view engine", "ejs");

// File database
const DB_FILE = path.join(__dirname, "db.json");

// Hàm đọc database
function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Lỗi đọc database:", error);
  }
  return { tokens: [] };
}

// Hàm ghi database
function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Lỗi ghi database:", error);
    return false;
  }
}

// Hàm tìm hoặc tạo token
function findOrCreateToken(tokenString) {
  const db = readDatabase();

  // Tìm token hiện có
  const existingToken = db.tokens.find((t) => t.token === tokenString);

  if (existingToken) {
    // Trả về state của token hiện có
    return existingToken.state.toString(); // "true" hoặc "false"
  } else {
    // Tạo token mới với state = false
    const newToken = {
      token: tokenString,
      state: false,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    // Thêm vào mảng tokens
    db.tokens.push(newToken);

    // Ghi vào file
    writeDatabase(db);

    console.log(`Đã thêm token mới: ${tokenString}`);

    // Trả về "false" vì token mới
    return "false";
  }
}

app.get("/", function (req, res) {
  res.render("index");
  res.end();
});

// API login - GET
// URL: /api/login?token=abc123
app.get("/api/login", function (req, res) {
  const { token } = req.query;

  if (!token) {
    return res.send("false");
  }

  const state = findOrCreateToken(token);
  res.send(state);
});

// API đổi state của token (ví dụ để active token)
// URL: /api/activate?token=abc123
app.get("/api/open", function (req, res) {
  const { token } = req.query;

  if (!token) {
    return res.send("false");
  }

  const db = readDatabase();
  const tokenIndex = db.tokens.findIndex((t) => t.token === token);

  if (tokenIndex === -1) {
    return res.send("false");
  }

  // Đổi state thành true
  db.tokens[tokenIndex].state = true;
  writeDatabase(db);
  res.send("true");
});

// API đổi state thành false (deactivate)
// URL: /api/deactivate?token=abc123
app.get("/api/deactivate", function (req, res) {
  const { token } = req.query;

  if (!token) {
    return res.send("false");
  }

  const db = readDatabase();
  const tokenIndex = db.tokens.findIndex((t) => t.token === token);

  if (tokenIndex === -1) {
    return res.send("false");
  }

  // Đổi state thành false
  db.tokens[tokenIndex].state = false;

  writeDatabase(db);

  res.send("true");
});

// API xóa token
// URL: /api/remove?token=abc123
app.get("/api/remove", function (req, res) {
  const { token } = req.query;

  if (!token) {
    return res.send("false");
  }

  const db = readDatabase();
  const initialLength = db.tokens.length;

  // Xóa token
  db.tokens = db.tokens.filter((t) => t.token !== token);

  if (db.tokens.length < initialLength) {
    writeDatabase(db);
    res.send("true");
  } else {
    res.send("false");
  }
});

// API xem tất cả tokens (debug)
// URL: /api/tokens
app.get("/api/tokens", function (req, res) {
  const db = readDatabase();
  res.json(db.tokens);
});

// API reset tất cả tokens (debug)
// URL: /api/reset-tokens
app.get("/api/reset-tokens", function (req, res) {
  const db = readDatabase();
  db.tokens = [];
  writeDatabase(db);
  res.send("Đã reset tất cả tokens");
});

// API tạo token random (test)
// URL: /api/generate
app.get("/api/generate", function (req, res) {
  // Tạo token random
  const randomToken =
    "token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

  // Thêm vào database với state = false
  const db = readDatabase();
  db.tokens.push({
    token: randomToken,
    state: false,
    createdAt: Date.now(),
  });
  writeDatabase(db);

  res.json({
    token: randomToken,
    state: false,
  });
});

const PORT = process.env.PORT || 80;
server.listen(PORT, function () {
  fs.rename("./dist/index.html", "./dist/index.ejs", function (err) {
    if (err) console.log("ERROR: " + err);
  });

  console.log("Server đang chạy trên port", PORT);
});
