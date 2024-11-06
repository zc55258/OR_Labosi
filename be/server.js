const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

const kluboviData = require("./PL_ekipe.json");

app.get("api/klubovi", (req, res) => {
    res.json(kluboviData);
});

app.listen(PORT, () => {
    console.log(`Server radi na http://localhost:${PORT}`);
});