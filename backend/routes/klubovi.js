const express = require("express");
const { Pool } = require("pg");
const json2csv = require("json2csv").parse;

const router = express.Router();

// Konfiguracija za PostgreSQL bazu
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'PL_ekipe',
    password: 'c3H76B4QC2',
    port: 5433,
});

// Ruta za dohvaćanje klubova
router.get('/', async (req, res) => {
    const { filterAttribute, filterValue } = req.query;

    let query = `
        SELECT k.ime_kluba, k.grad, k.nadimak, k.godina_osnivanja, 
               s.naziv AS stadion_naziv, s.kapacitet AS stadion_kapacitet,
               t.ime AS trener_ime, t.prezime AS trener_prezime,
               json_agg(json_build_object('ime', i.ime, 'prezime', i.prezime)) AS igraci
        FROM klubovi k
        JOIN stadioni s ON k.id_kluba = s.id_kluba
        JOIN treneri t ON k.id_kluba = t.id_kluba
        LEFT JOIN igraci i ON k.id_kluba = i.id_kluba
    `;

    if (filterAttribute && filterValue) {
        query += ` WHERE ${filterAttribute} ILIKE $1`;
    }

    query += ` GROUP BY k.id_kluba, s.naziv, s.kapacitet, t.ime, t.prezime`;

    try {
        const result = await pool.query(query, filterAttribute && filterValue ? [`%${filterValue}%`] : []);
        res.json(result.rows);
    } catch (error) {
        console.error('Greška pri dohvaćanju podataka:', error);
        res.status(500).json({ error: 'Došlo je do greške pri dohvaćanju podataka.' });
    }
});

// Ruta za preuzimanje podataka
router.get('/download', async (req, res) => {
    const { type, filterAttribute, filterValue } = req.query;

    let query = `
        SELECT k.ime_kluba, k.grad, k.nadimak, k.godina_osnivanja, 
               s.naziv AS stadion_naziv, s.kapacitet AS stadion_kapacitet,
               t.ime AS trener_ime, t.prezime AS trener_prezime,
               json_agg(json_build_object('ime', i.ime, 'prezime', i.prezime)) AS igraci
        FROM klubovi k
        JOIN stadioni s ON k.id_kluba = s.id_kluba
        JOIN treneri t ON k.id_kluba = t.id_kluba
        LEFT JOIN igraci i ON k.id_kluba = i.id_kluba
    `;

    if (filterAttribute && filterValue) {
        query += ` WHERE ${filterAttribute} ILIKE $1`;
    }

    query += ` GROUP BY k.id_kluba, s.naziv, s.kapacitet, t.ime, t.prezime`;

    try {
        const result = await pool.query(query, filterAttribute && filterValue ? [`%${filterValue}%`] : []);
        const data = result.rows;

        if (type === 'csv') {
            const csv = json2csv(data);
            res.header('Content-Type', 'text/csv');
            res.attachment(`PL_ekipe_filtrirano_${filterAttribute || "sve"}.csv`);
            res.send(csv);
        } else if (type === 'json') {
            res.header('Content-Type', 'application/json');
            res.attachment(`PL_ekipe_filtrirano_${filterAttribute || "sve"}.json`);
            res.send(JSON.stringify(data, null, 2));
        } else {
            res.status(400).json({ error: 'Nepoznat tip datoteke.' });
        }
    } catch (error) {
        console.error('Greška pri preuzimanju podataka:', error);
        res.status(500).json({ error: 'Došlo je do greške pri preuzimanju podataka.' });
    }
});



module.exports = router;
