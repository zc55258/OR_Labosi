const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const Client = new Client({
    user: 'Željko',
    host: 'localhost',
    database: 'PL_ekipe',
    password: 'c3H76B4QC2',
    port: 5433,
});

client.connect()
    .then(() => console.log("Povezan s bazon podataka"))
    .catch(err => console.error("Greška pri povezivanju s bazon:", err));



// Pokreni server
app.listen(port, () => {
    console.log(`Server radi na http://localhost:${port}`);
  });