const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const app = express();
const port = 3000;

const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'PL_ekipe',
    password: 'igorisonja04' ,
    port: 5433,
});

app.use(cors());

// Endpoint za dohvaćanje svih klubova i pripadajućih podataka
app.get('/api/klubovi', async (req, res) => {
    const query = `
        SELECT k.ime_kluba, k.grad, k.nadimak, k.godina_osnivanja, 
               s.naziv AS stadion_naziv, s.kapacitet AS stadion_kapacitet,
               t.ime AS trener_ime, t.prezime AS trener_prezime,
               json_agg(json_build_object('ime', i.ime, 'prezime', i.prezime)) AS igraci
        FROM klubovi k
        JOIN stadioni s ON k.id_kluba = s.id_kluba
        JOIN treneri t ON k.id_kluba = t.id_kluba
        LEFT JOIN igraci i ON k.id_kluba = i.id_kluba
        GROUP BY k.id_kluba, s.naziv, s.kapacitet, t.ime, t.prezime;
    `;

    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Greška pri dohvaćanju podataka:', error);
        res.status(500).json({ error: 'Došlo je do greške pri dohvaćanju podataka.' });
    }
});

app.listen(port, () => {
    console.log(`Poslužitelj pokrenut na http://localhost:${port}`);
});