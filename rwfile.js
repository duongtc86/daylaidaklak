const { json } = require("express");
const fs = require("fs");

module.exports = {
  docfile: function (path) {
    let arr = [];
    fs.readFileSync(path, "utf-8")
      .split(/\r?\n/)
      .forEach(function (line) {
        const jsonString = JSON.stringify(Object.assign({}, line.split("|")));
        arr.push(jsonString);
      });
    arr.pop();
    return arr;
  },
  ghifile: function (path, obj) {
    let content = "";
    for (var key in obj) {
      var value = obj[key];
      content += value + "|";
    }

    content = content.slice(0, -1);

    fs.appendFile(path, content + "\n", function (err) {
      if (err) throw err;
    });
  },
};
