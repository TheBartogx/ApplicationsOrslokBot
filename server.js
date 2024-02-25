const express = require("express");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const app = express();
const PORT = 3000;
const bodyParser = require("body-parser");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.get("/en-vivo", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/en-vivo.html"));
});

app.get("/moderar", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/moderar.html"));
});

app.get("/moderara", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/moderara.html"));
});

app.get("/en-vivoa", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/en-vivoa.html"));
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ruta para actualizar el estado de moderación
app.post('/updateModerationStatus', async (req, res) => {
  const { folder, status } = req.body;

  try {
      // Lee el archivo info.json existente
      const filePath = `public/audios/${folder}/info.json`;
      const content = await fsp.readFile(filePath, 'utf8');
      const infoData = JSON.parse(content);

      // Actualiza el estado de moderación
      infoData.moderadoE = parseInt(status);

      // Guarda la información actualizada en el archivo info.json
      await fsp.writeFile(filePath, JSON.stringify(infoData, null, 2));

      res.json({ success: true, message: `Moderation status updated for ${folder}: ${status}` });
  } catch (error) {
      console.error('Error updating moderation status:', error);
      res.status(500).json({ success: false, message: 'Error updating moderation status' });
  }
});

app.get("/audios", (req, res) => {
  const audioPath = path.join(__dirname, "public", "audios");

  fs.readdir(audioPath, (err, folders) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    const audioData = folders.map((folder) => {
      const folderPath = path.join(audioPath, folder);
      const files = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith(".ogg"));
      return {
        folder,
        audioFiles: files,
      };
    });

    res.json(audioData);
  });
});

app.get("/getVideos", (req, res) => {
  const videosFolder = "public/videos/no_moderados";

  fs.readdir(videosFolder, (err, files) => {
    if (err) {
      console.error("Error al leer la carpeta de videos:", err);
      res.status(500).json({ error: "Error al obtener la lista de videos" });
    } else {
      // Filtrar archivos con extensión .mp4
      const videoFiles = files.filter((file) => file.endsWith(".mp4"));
      res.json(videoFiles);
    }
  });
});

app.get("/getVideosModerados", (req, res) => {
  const videosFolder = "public/videos/moderados";

  fs.readdir(videosFolder, (err, files) => {
    if (err) {
      console.error("Error al leer la carpeta de videos:", err);
      res.status(500).json({ error: "Error al obtener la lista de videos" });
    } else {
      // Filtrar archivos con extensión .mp4
      const videoFiles = files.filter((file) => file.endsWith(".mp4"));
      res.json(videoFiles);
    }
  });
});

app.get("/likeVideo", (req, res) => {
  const videoName = req.query.video;

  const sourcePath = path.join(
    __dirname,
    "public",
    "videos",
    "no_moderados",
    videoName
  );
  const destinationPath = path.join(
    __dirname,
    "public",
    "videos",
    "moderados",
    videoName
  );

  fs.rename(sourcePath, destinationPath, (err) => {
    if (err) {
      console.error("Error al mover el video a moderados:", err);
      res.status(500).json({ error: "Error al mover el video a moderados" });
    } else {
      res.json({ success: true });
    }
  });
});

app.get("/dislikeVideo", (req, res) => {
  const videoName = req.query.video;
  const filePath = path.join(
    __dirname,
    "public",
    "videos",
    "no_moderados",
    videoName
  );

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error al eliminar el video de no_moderados:", err);
      res
        .status(500)
        .json({ error: "Error al eliminar el video de no_moderados" });
    } else {
      res.json({ success: true });
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor web iniciado en http://localhost:${port}`);
});
