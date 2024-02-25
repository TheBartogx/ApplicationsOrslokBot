const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/audios', (req, res) => {
    const audioPath = path.join(__dirname, 'public', 'audios');

    fs.readdir(audioPath, (err, folders) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        const audioData = folders.map(folder => {
            const folderPath = path.join(audioPath, folder);
            const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.ogg'));
            return {
                folder,
                audioFiles: files,
            };
        });

        res.json(audioData);
    });
});

app.listen(port, () => {
    console.log(`Servidor web corriendo en http://localhost:${port}`);
});
