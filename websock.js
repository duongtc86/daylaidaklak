const websock = require("ws");
const rw = require("./rwfile");

function JsonString(str) {
  return JSON.stringify(str);
}

function StringJson(str) {
  return JSON.parse(str);
}
let wss;

function broadcast(ws, message) {
  wss.clients.forEach((client) => {
    if (client !== ws) {
      client.send(JsonString(message));
    }
  });
}

function sends(ws, message) {
  wss.clients.forEach((client) => {
    if (client === ws) {
      client.send(JsonString(message));
    }
  });
}

function send_all(message) {
  wss.clients.forEach((client) => {
    client.send(JsonString(message));
  });
}
module.exports = {
  init: function (server) {
    wss = new websock.Server({
      server,
    });
    this.on();
  },
  on: function () {
    wss.on("connection", function (ws) {
      ws.on("message", function (dt) {
        var res = StringJson(dt);
        console.log("mgs", res);
        let content;
        switch (res.type) {
          case "dangkyhoc":
            rw.ghifile("./data/dangkyhoc.txt", res.data);
            content = {
              type: "dangkyhocs",
              data: true,
            };

            send_all(content);
            break;
          case "login":
            let arr = rw.docfile("./data/login.txt");
            let sumit = false;
            arr.forEach((e) => {
              e = JSON.parse(e);
              if (e["0"] === res.data.username && e["1"] === res.data.pass) {
                sumit = true;
              }
            });
            content = {
              type: "logins",
              data: sumit,
            };
            sends(ws, content);
            break;
          case "login_user":
            content = {
              type: "danhsachhv",
              data: rw.docfile("./data/dangkyhoc.txt"),
            };
            console.log(rw.docfile("./data/dangkyhoc.txt"));
            sends(ws, content);
            break;
        }
      });
    });
  },
};
