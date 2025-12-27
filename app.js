const http = require("http");
const express = require("express");
const axios = require("axios");
const app = express();

const fs = require("fs");
const path = require("path");
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Biến môi trường cho GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // GitHub Personal Access Token
const GIST_ID = process.env.GIST_ID; // ID của Gist đã tạo
const GIST_FILENAME = "db.json"; // Tên file trong Gist

// Class quản lý database trên GitHub Gist
class GitHubGistDB {
  constructor() {
    if (!GITHUB_TOKEN) {
      console.error("❌ LỖI: Chưa cấu hình GITHUB_TOKEN trong biến môi trường");
      console.log("👉 Tạo token tại: https://github.com/settings/tokens");
      console.log("👉 Chọn scope: gist");
    }

    if (!GIST_ID) {
      console.warn("⚠ CHÚ Ý: Chưa có GIST_ID, sẽ tạo Gist mới tự động");
    }
  }

  // Đọc dữ liệu từ Gist
  async read() {
    try {
      // Nếu chưa có GIST_ID, tạo Gist mới
      if (!GIST_ID) {
        return await this.createNewGist();
      }

      const response = await axios.get(
        `https://api.github.com/gists/${GIST_ID}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Token-Management-System",
          },
        }
      );

      if (response.data.files[GIST_FILENAME]) {
        const content = response.data.files[GIST_FILENAME].content;
        return JSON.parse(content);
      } else {
        // File không tồn tại trong Gist, tạo mới
        return await this.initializeGist();
      }
    } catch (error) {
      console.error("❌ Lỗi đọc Gist:", error.message);

      // Nếu Gist không tồn tại, tạo mới
      if (error.response && error.response.status === 404) {
        console.log("📝 Gist không tồn tại, tạo Gist mới...");
        return await this.createNewGist();
      }

      // Trả về dữ liệu mặc định nếu có lỗi
      return { tokens: [] };
    }
  }

  // Ghi dữ liệu vào Gist
  async write(data) {
    try {
      // Nếu chưa có GIST_ID, tạo Gist mới trước
      if (!GIST_ID) {
        const gistData = await this.createNewGistWithData(data);
        console.log("✅ Đã tạo Gist mới với ID:", gistData.gistId);
        console.log(
          "👉 Hãy set GIST_ID=" + gistData.gistId + " trong biến môi trường"
        );
        return true;
      }

      await axios.patch(
        `https://api.github.com/gists/${GIST_ID}`,
        {
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2),
            },
          },
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Token-Management-System",
          },
        }
      );

      console.log("💾 Đã lưu dữ liệu lên GitHub Gist");
      return true;
    } catch (error) {
      console.error("❌ Lỗi ghi Gist:", error.message);
      return false;
    }
  }

  // Tạo Gist mới
  async createNewGist() {
    try {
      const initialData = {
        tokens: [
          {
            token: "demo_token_123",
            state: true,
            createdAt: new Date().toLocaleDateString("vi-VN"),
            description: "Token demo đã active",
          },
          {
            token: "inactive_token_456",
            state: false,
            createdAt: new Date().toLocaleDateString("vi-VN"),
            description: "Token demo chưa active",
          },
        ],
      };

      const response = await axios.post(
        "https://api.github.com/gists",
        {
          description: "Token Database for Management System",
          public: false, // Gist private
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(initialData, null, 2),
            },
          },
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Token-Management-System",
          },
        }
      );

      const gistId = response.data.id;
      console.log("✅ Đã tạo Gist mới thành công!");
      console.log("🔗 Gist URL:", response.data.html_url);
      console.log("🆔 Gist ID:", gistId);
      console.log("👉 Hãy set GIST_ID=" + gistId + " trong biến môi trường");

      return initialData;
    } catch (error) {
      console.error("❌ Lỗi tạo Gist mới:", error.message);
      return { tokens: [] };
    }
  }

  // Tạo Gist mới với dữ liệu cụ thể
  async createNewGistWithData(data) {
    const response = await axios.post(
      "https://api.github.com/gists",
      {
        description: "Token Database for Management System",
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Token-Management-System",
        },
      }
    );

    return {
      gistId: response.data.id,
      url: response.data.html_url,
      data: data,
    };
  }

  // Khởi tạo Gist với dữ liệu mặc định
  async initializeGist() {
    const initialData = { tokens: [] };
    await this.write(initialData);
    return initialData;
  }

  // Kiểm tra kết nối GitHub
  async checkConnection() {
    try {
      if (!GITHUB_TOKEN) {
        return { connected: false, error: "Chưa cấu hình GITHUB_TOKEN" };
      }

      if (!GIST_ID) {
        return {
          connected: true,
          warning: "Chưa có GIST_ID, sẽ tạo mới khi cần",
        };
      }

      await axios.get(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      return { connected: true, message: "Đã kết nối đến GitHub Gist" };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        status: error.response?.status,
      };
    }
  }
}

// Khởi tạo database
const db = new GitHubGistDB();

// Static files và view engine
app.use(express.static("dist"));
app.set("views", "./dist");
app.set("view engine", "ejs");

// Route chính
app.get("/", function (req, res) {
  res.render("index");
  res.end();
});
app.get("/api", function (req, res) {
  res.render("api");
  res.end();
});
// API kiểm tra kết nối
app.get("/api/status", async function (req, res) {
  const status = await db.checkConnection();
  res.json(status);
});

// API login - GET: Kiểm tra hoặc tạo token mới
app.get("/api/login", async function (req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.send("false");
    }

    // Đọc database từ Gist
    const data = await db.read();

    // Tìm token hiện có
    const existingToken = data.tokens.find((t) => t.token === token);

    if (existingToken) {
      // Token đã tồn tại, trả về state
      res.send(existingToken.state ? "true" : "false");
    } else {
      // Token chưa có, tạo mới với state = false
      const newToken = {
        token: token,
        state: false,
        createdAt: new Date().toLocaleDateString("vi-VN"),
        lastAccessed: new Date().toLocaleString("vi-VN"),
      };

      data.tokens.push(newToken);

      // Lưu database lên Gist
      await db.write(data);

      console.log(`✅ Đã thêm token mới: ${token}`);
      res.send("false"); // Token mới luôn có state = false
    }
  } catch (error) {
    console.error("❌ Lỗi API login:", error);
    res.send("false");
  }
});

// API activate - GET: Đổi state thành true
app.get("/api/activate", async function (req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.send("false");
    }

    const data = await db.read();
    const tokenIndex = data.tokens.findIndex((t) => t.token === token);

    if (tokenIndex === -1) {
      return res.send("false");
    }

    // Đổi state thành true
    data.tokens[tokenIndex].state = true;
    data.tokens[tokenIndex].activatedAt = new Date().toLocaleString("vi-VN");
    data.tokens[tokenIndex].lastModified = new Date().toLocaleString("vi-VN");

    await db.write(data);

    console.log(`✅ Đã kích hoạt token: ${token}`);
    res.send("true");
  } catch (error) {
    console.error("❌ Lỗi API activate:", error);
    res.send("false");
  }
});

// API deactivate - GET: Đổi state thành false
app.get("/api/deactivate", async function (req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.send("false");
    }

    const data = await db.read();
    const tokenIndex = data.tokens.findIndex((t) => t.token === token);

    if (tokenIndex === -1) {
      return res.send("false");
    }

    // Đổi state thành false
    data.tokens[tokenIndex].state = false;
    data.tokens[tokenIndex].deactivatedAt = new Date().toLocaleString("vi-VN");
    data.tokens[tokenIndex].lastModified = new Date().toLocaleString("vi-VN");

    await db.write(data);

    console.log(`✅ Đã hủy kích hoạt token: ${token}`);
    res.send("true");
  } catch (error) {
    console.error("❌ Lỗi API deactivate:", error);
    res.send("false");
  }
});

// API xem tất cả tokens
app.get("/api/tokens", async function (req, res) {
  try {
    const data = await db.read();
    res.json({
      total: data.tokens.length,
      active: data.tokens.filter((t) => t.state).length,
      inactive: data.tokens.filter((t) => !t.state).length,
      tokens: data.tokens,
    });
  } catch (error) {
    console.error("❌ Lỗi API tokens:", error);
    res.json({
      total: 0,
      active: 0,
      inactive: 0,
      tokens: [],
      error: error.message,
    });
  }
});

// API tạo token ngẫu nhiên
app.get("/api/generate", async function (req, res) {
  try {
    // Tạo token ngẫu nhiên
    const randomToken =
      "token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    // Thêm vào database
    const data = await db.read();
    const newToken = {
      token: randomToken,
      state: false,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      description: "Token được tạo tự động",
    };

    data.tokens.push(newToken);
    await db.write(data);

    res.json({
      success: true,
      token: randomToken,
      state: false,
      message: "Token đã được tạo và lưu vào database",
      createdAt: newToken.createdAt,
    });
  } catch (error) {
    console.error("❌ Lỗi API generate:", error);
    res.json({ success: false, error: error.message });
  }
});

// API xóa token
app.get("/api/remove", async function (req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.send("false");
    }

    const data = await db.read();
    const initialLength = data.tokens.length;

    // Xóa token
    data.tokens = data.tokens.filter((t) => t.token !== token);

    if (data.tokens.length < initialLength) {
      await db.write(data);
      console.log(`✅ Đã xóa token: ${token}`);
      res.send("true");
    } else {
      res.send("false");
    }
  } catch (error) {
    console.error("❌ Lỗi API remove:", error);
    res.send("false");
  }
});

// API reset tất cả tokens (chỉ để test)
app.get("/api/reset", async function (req, res) {
  try {
    const data = { tokens: [] };
    await db.write(data);
    console.log("✅ Đã reset toàn bộ database");
    res.send("✅ Đã reset toàn bộ database");
  } catch (error) {
    console.error("❌ Lỗi API reset:", error);
    res.send("false");
  }
});

// Route 404
app.use(function (req, res) {
  res.status(404).send("404 - Không tìm thấy trang");
});

// Khởi động server
const PORT = process.env.PORT || 80;

server.listen(PORT, async function () {
  console.log("=".repeat(60));
  console.log("🚀 Khởi động Token Management System...");
  console.log("📁 Database: GitHub Gist");
  console.log("🌐 Port:", PORT);
  console.log("=".repeat(60));

  // Kiểm tra kết nối GitHub
  const status = await db.checkConnection();
  if (status.connected) {
    console.log("✅ " + (status.message || "Kết nối GitHub Gist thành công"));
  } else {
    console.log("❌ Lỗi kết nối GitHub:", status.error);
    if (!GITHUB_TOKEN) {
      console.log("\n🔧 HƯỚNG DẪN CẤU HÌNH:");
      console.log(
        "1. Tạo GitHub Token tại: https://github.com/settings/tokens"
      );
      console.log("2. Chọn scope: gist");
      console.log("3. Thêm vào Render Environment Variables:");
      console.log("   - Key: GITHUB_TOKEN");
      console.log("   - Value: token_cua_ban");
      console.log("\n4. (Tùy chọn) Tạo Gist và set GIST_ID");
    }
  }

  // Đọc và hiển thị thông tin database
  try {
    const data = await db.read();
    console.log(`📊 Database có ${data.tokens.length} tokens`);
    if (data.tokens.length > 0) {
      console.log(`   ✅ Active: ${data.tokens.filter((t) => t.state).length}`);
      console.log(
        `   ❌ Inactive: ${data.tokens.filter((t) => !t.state).length}`
      );
    }
  } catch (error) {
    console.log("📊 Chưa có database, sẽ tạo mới khi có token đầu tiên");
  }

  console.log("=".repeat(60));
  console.log("📎 API Endpoints:");
  console.log(`   GET http://localhost:${PORT}/api/login?token=YOUR_TOKEN`);
  console.log(`   GET http://localhost:${PORT}/api/tokens`);
  console.log(`   GET http://localhost:${PORT}/api/generate`);
  console.log("=".repeat(60));

  // Giữ nguyên phần rename của bạn
  fs.rename("./dist/index.html", "./dist/index.ejs", function (err) {
    if (err) console.log("ERROR: " + err);
  });
});
