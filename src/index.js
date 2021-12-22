const express = require("express");

const app = express();

app.get("/", (request, response) => {
  response.json({ msg: "Olá Mundo!" });
});

app.listen(3333);
