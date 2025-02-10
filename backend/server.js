const express = require("express");
const kluboviRoutes = require('./routes/klubovi');
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const { auth } = require('express-openid-connect');

const app = express();
const port = 3000;






const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "PL_ekipe",
    password: "c3H76B4QC2",
    port: 5433,
});

// Konfiguracija Auth0
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: "kf7lJxkoYjUhVhMC2KZlYozh2-msXi1RuDH5PMFo6j5SViOtX0BKzArITKjXdhhj",
    baseURL: "http://localhost:3000",
    clientID: "nxGbH935NKcSLrtCv5TL8J9BZUFO6pA0",
    issuerBaseURL: "https://dev-2gijkdr328psnf2j.us.auth0.com",
};

app.use(auth(config));

// Služenje statičkih datoteka
app.use(express.static("C:/Users/Željko/OneDrive/Dokumenti/GitHub/OR_Labosi"));

// Ruta za dohvaćanje korisničkih podataka
app.get("/user", (req, res) => {
    if (req.oidc.isAuthenticated()) {
        res.json({
            name: req.oidc.user.name,
            email: req.oidc.user.email
        });
    } else {
        res.status(401).json({ error: "Korisnik nije prijavljen." });
    }
});

// Ruta za glavnu stranicu
app.get("/", (req, res) => {
    res.sendFile(path.join("C:/Users/Željko/OneDrive/Dokumenti/GitHub/OR_Labosi", "index.html"));
});



//app.use(cors());
//app.use(bodyParser.json());
//app.use(express.json());
//app.use('/api/klubovi', kluboviRoutes);


function responseWrapper(data, error = null) {
    return {
        success: error === null,
        data: data,
        error: error,
    };
}

// GET: Dohvati sve klubove
app.get("/api/klubovi", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM klubovi");

        const clubs = result.rows.map(club => ({
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            "name": club.ime_kluba,
            "addressLocality": club.grad,
            "foundingDate": club.godina_osnivanja,
            "alternateName": club.nadimak
        }));

       
        res.json(clubs);
    } catch (error) {
        console.error("Greška pri dohvaćanju klubova:", error);
        res.status(500).json({ error: "Greška pri dohvaćanju klubova." });
    }
});

// GET: Dohvati klub prema imenu kluba
app.get("/api/klubovi/ime/:ime_kluba", async (req, res) => {
    const { ime_kluba } = req.params;
    try {
        const result = await pool.query("SELECT * FROM klubovi WHERE ime_kluba ILIKE $1", [`%${ime_kluba}%`]);
        if (result.rows.length === 0) {
            res.status(404).json(responseWrapper(null, `Klub s imenom ${ime_kluba} nije pronađen.`));
        } else {
            res.json(responseWrapper(result.rows));
        }
    } catch (error) {
        console.error("Greška pri dohvaćanju kluba:", error);
        res.status(500).json(responseWrapper(null, "Greška pri dohvaćanju kluba."));
    }
});

// GET: Dohvati klubove prema gradu
app.get("/api/klubovi/grad/:grad", async (req, res) => {
    const { grad } = req.params;
    try {
        const result = await pool.query("SELECT * FROM klubovi WHERE grad ILIKE $1", [`%${grad}%`]);
        res.json(responseWrapper(result.rows));
    } catch (error) {
        console.error("Greška pri dohvaćanju klubova prema gradu:", error);
        res.status(500).json(responseWrapper(null, "Greška pri dohvaćanju klubova prema gradu."));
    }
});

// GET: Dohvati klubove prema nadimku
app.get("/api/klubovi/nadimak/:nadimak", async (req, res) => {
    const { nadimak } = req.params;
    try {
        const result = await pool.query("SELECT * FROM klubovi WHERE nadimak ILIKE $1", [`%${nadimak}%`]);
        res.json(responseWrapper(result.rows));
    } catch (error) {
        console.error("Greška pri dohvaćanju klubova prema nadimku:", error);
        res.status(500).json(responseWrapper(null, "Greška pri dohvaćanju klubova prema nadimku."));
    }
});

// GET: Dohvati klubove prema godini osnivanja
app.get("/api/klubovi/godina/:godina", async (req, res) => {
    const { godina } = req.params;
    try {
        const result = await pool.query("SELECT * FROM klubovi WHERE godina_osnivanja = $1", [godina]);
        res.json(responseWrapper(result.rows));
    } catch (error) {
        console.error("Greška pri dohvaćanju klubova prema godini osnivanja:", error);
        res.status(500).json(responseWrapper(null, "Greška pri dohvaćanju klubova prema godini osnivanja."));
    }
});

// POST: Dodaj novi klub
app.post("/api/klubovi", async (req, res) => {
    const { ime_kluba, grad, nadimak, godina_osnivanja, stadion, trener, igraci } = req.body;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const klubResult = await client.query(
            "INSERT INTO klubovi (ime_kluba, grad, nadimak, godina_osnivanja) VALUES ($1, $2, $3, $4) RETURNING id_kluba",
            [ime_kluba, grad, nadimak, godina_osnivanja]
        );
        const klubId = klubResult.rows[0].id_kluba;

        if (stadion) {
            await client.query(
                "INSERT INTO stadioni (id_kluba, naziv, kapacitet) VALUES ($1, $2, $3)",
                [klubId, stadion.naziv, stadion.kapacitet]
            );
        }

        if (trener) {
            await client.query(
                "INSERT INTO treneri (id_kluba, ime, prezime) VALUES ($1, $2, $3)",
                [klubId, trener.ime, trener.prezime]
            );
        }

        if (igraci && Array.isArray(igraci)) {
            const playerPromises = igraci.map((igrac) =>
                client.query(
                    "INSERT INTO igraci (id_kluba, ime, prezime) VALUES ($1, $2, $3)",
                    [klubId, igrac.ime, igrac.prezime]
                )
            );
            await Promise.all(playerPromises);
        }

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Klub i povezani entiteti uspješno dodani.",
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Greška pri dodavanju kluba i povezanih entiteta:", error);
        res.status(500).json({
            success: false,
            message: "Došlo je do greške pri dodavanju kluba i povezanih entiteta.",
        });
    } finally {
        client.release();
    }
});


// PUT: Ažuriraj klub prema imenu kluba
app.put("/api/klubovi/ime/:ime_kluba", async (req, res) => {
    const { ime_kluba } = req.params;
    const { grad, nadimak, godina_osnivanja } = req.body;
    try {
        const result = await pool.query(
            "UPDATE klubovi SET grad = $1, nadimak = $2, godina_osnivanja = $3 WHERE ime_kluba ILIKE $4 RETURNING *",
            [grad, nadimak, godina_osnivanja, ime_kluba]
        );
        if (result.rows.length === 0) {
            res.status(404).json(responseWrapper(null, `Klub s imenom ${ime_kluba} nije pronađen.`));
        } else {
            res.json(responseWrapper(result.rows[0]));
        }
    } catch (error) {
        console.error("Greška pri ažuriranju kluba:", error);
        res.status(500).json(responseWrapper(null, "Greška pri ažuriranju kluba."));
    }
});

// DELETE: Obriši klub prema imenu kluba
app.delete("/api/klubovi/ime/:ime_kluba", async (req, res) => {
    const { ime_kluba } = req.params;
    try {
        const result = await pool.query("DELETE FROM klubovi WHERE ime_kluba ILIKE $1 RETURNING *", [ime_kluba]);
        if (result.rows.length === 0) {
            res.status(404).json(responseWrapper(null, `Klub s imenom ${ime_kluba} nije pronađen.`));
        } else {
            res.json(responseWrapper(result.rows[0]));
        }
    } catch (error) {
        console.error("Greška pri brisanju kluba:", error);
        res.status(500).json(responseWrapper(null, "Greška pri brisanju kluba."));
    }
});

app.listen(port, () => {
    console.log(`Poslužitelj pokrenut na http://localhost:${port}`);
});
