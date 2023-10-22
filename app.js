const http = require("http");
const express = require("express");
const app = express();

var fs = require("fs");
// var https_options = {
//   key: fs.readFileSync("./keyssl/private.key"),
//   cert: fs.readFileSync("./keyssl/certificate.crt"),
//   ca: fs.readFileSync("./keyssl/ca_bundle.crt"),
// };

const server = http.createServer(app);

// const wss = require("./websock");
// wss.init(server);

// app.use(express.static("public"));
// app.use(cors());

app.use(express.static("dist"));
app.set("views", "./dist");
app.set("view engine", "ejs");

app.get("/", function (req, res) {
  res.render("index");
  res.end();
});

// app.get("/login", function (req, res) {
//   res.render("login");
//   res.end();
// });
// app.get("/dashboard", function (req, res) {
//   res.render("dashboard");
//   res.end();
// });

const PORT = process.env.PORT || 80;
server.listen(PORT, function () {
  fs.rename("./dist/index.html", "./dist/index.ejs", function (err) {
    if (err) console.log("ERROR: " + err);
  });
  console.log("start server");
});
