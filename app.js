const http = require("http");
const express = require("express");
const app = express();

var fs = require("fs");
const server = http.createServer(app);

// const wss = require("./websock");
// wss.init(server);

app.use(express.static("dist"));
app.set("views", "./dist");
app.set("view engine", "ejs");

app.get("/", function (req, res) {
  res.render("index");
  res.end();
});

const PORT = process.env.PORT || 80;
server.listen(PORT, function () {
  fs.rename("./dist/index.html", "./dist/index.ejs", function (err) {
    if (err) console.log("ERROR: " + err);
  });
  console.log("start server");
});
