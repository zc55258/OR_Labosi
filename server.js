const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = 3000;

// Postavljamo direktorij "public" kao statički direktorij
app.use(express.static(path.join(__dirname, 'public')));

// RUTA ZA DOHVAT PODATAKA O KLUBOVIMA
app.get('/klubovi', async (req, res) => {
    try {
        const data = await fs.readFile('PL_ekipe.json', 'utf8');  // Ispraviti naziv datoteke
        const klubovi = JSON.parse(data);
        res.json(klubovi);
    } catch (err) {
        console.error('Greška prilikom čitanja JSON datoteke:', err);
        res.status(500).send('Došlo je do greške.');
    }
});

// Pokretanje servera na portu 3000
app.listen(PORT, () => {
    console.log(`Server pokrenut na http://localhost:${PORT}`);
});
