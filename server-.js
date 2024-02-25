const express = require("express");
const displayRoutes = require("express-routemap");
const cors = require("cors");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

const BASE_PREFIX = process.env.BASE_PREFIX || "api";

app.use(express.json()); // sin esto no podemos ver el req.body
app.use(express.urlencoded({ extended: true })); // sino se agrega no podremos tomar los parametros de la url del request, req.query
app.use(cors());

app.use("/static", express.static(`${__dirname}/public`));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.get(`/${BASE_PREFIX}/alive`, (req, res) => {
  return res.json({
    message: `Hola hiciste tu 1ra api, y esta ejecutandose en RAILWAY.APP- ${process.env.NODE_ENV}`,
  });
});

app.use(`/${BASE_PREFIX}/users`, userRoutes);
app.use(`/${BASE_PREFIX}/pets`, petsRoutes);

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

app.listen(PORT, () => {
  displayRoutes(app);
  console.log(`Servidor web iniciado en ${port}`);
});
