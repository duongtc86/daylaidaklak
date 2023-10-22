let my_data = {
  name: "duong",
  drawer: false,
  loga: () => {
    var values = [],
      keys = Object.keys(localStorage),
      i = keys.length;

    while (i--) {
      values.push(localStorage.getItem(keys[i]));
    }
    console.log(values);

    return values;
  },
  render: () => {
    for (let index = 0; index < 10; index++) {
      console.log("index");

      localStorage.setItem("lastname" + index, "Smith" + index);
    }
  },
};
// my_data.render();
