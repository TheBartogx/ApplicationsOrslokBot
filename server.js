const express = require("express");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const app = express();
const PORT = process.env.PORT || 80;
const bodyParser = require("body-parser");


const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const { parse } = require('url');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const usuariosExcluidos = ['1204964031673147413', '671382351674212382', '273081779420921856', '400978022569869312', '1118046093985452092', '121776580463689739', '403681485690765312'];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});


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




/*############################ DISCORD ################################*/
client.on('messageCreate', async (message) => {
  // Verificar si el mensaje es del canal específico y no enviado por un usuario excluido
  if (message.channel.id === '1207371105891917945') {
    // Verificar si el mensaje tiene archivos adjuntos
    if (message.attachments.size > 0) {
      const attachmentURL = message.attachments.first().url;
      const parsedUrl = parse(attachmentURL);
      const fileName = parsedUrl.pathname.split('/').pop();
      const extension = fileName.split('.').pop(); // Obtener la extensión del archivo

      if (extension.toLowerCase() !== 'mp4') {
        console.log(message.author.username)
        console.error(`${message.author.id} extensión erronea`);
        message.channel.send(`<@${message.author.id}> No se permiten archivos que no sean extensión ".mp4" master.`);
        return; // Salir de la función si no es un archivo .mp4
      }

      if (!fs.existsSync('public/videos/no_moderados')) {
        fs.mkdirSync('public/videos/no_moderados');
      }

      // Obtener el último id existente en la carpeta 'videos'
      const files = fs.readdirSync('public/videos/no_moderados/');
      let lastId = 0;

      files.forEach((file) => {
        const fileId = parseInt(file.split('.')[0]);
        if (!isNaN(fileId) && fileId > lastId) {
          lastId = fileId;
        }
      });

      const nextId = lastId + 1;
      const newFileName = `${nextId}_${message.author.username}.mp4`;
      const filePath = `public/videos/no_moderados/${newFileName}`;

      const fileStream = fs.createWriteStream(filePath);
      const axios = require('axios');

      const response = await axios({
        method: 'GET',
        url: attachmentURL,
        responseType: 'stream',
      });

      response.data.pipe(fileStream);

      fileStream.on('finish', () => {
        console.log(`Archivo guardado en: public/videos/no_moderados/${newFileName}`);
      });

      fileStream.on('error', (err) => {
        console.error('Error al guardar el archivo:', err);
      });
    }
    else if(!usuariosExcluidos.includes(message.author.id)) {
      // Enviar mensaje si no hay archivos adjuntos
      message.channel.send(`<@${message.author.id}>, solo se permiten videos bro.`);
      console.error(`${message.author.id}, mal envio de mensajes.`, err);
    }
  }

/*######################################################################### AUDIOS ######################################################################################## */
            
            if (message.channel.id === '1207368304579055636') {
                if (message.attachments.size > 0) {
                    const attachmentURL = message.attachments.first().url;
                    const parsedUrl = parse(attachmentURL);
                    const audioFileName = parsedUrl.pathname.split('/').pop();
                    const jsonFileName = `info.json`; // Cambia el nombre del archivo JSON aquí
            
                    if (!fs.existsSync('public/audios')) {
                        fs.mkdirSync('public/audios');
                    }
            
                    let userFolder;
            
                    if (message.guild) {
                        userFolder = `public/audios/${message.author.username}`;
                    } else {
                        userFolder = `public/audios/DMs/${message.author.username}`;
                    }
            
                    if (!fs.existsSync(userFolder)) {
                        fs.mkdirSync(userFolder);
                    }
            
                    const filePath = `${userFolder}/${audioFileName}`;
                    const jsonFilePath = `${userFolder}/${jsonFileName}`;
                    const tm = new Date(message.createdTimestamp).toLocaleString();
                    const fileStream = fs.createWriteStream(filePath);
                    const jsonData = {
                      user: message.author.globalName,
                      ID: message.author.id,
                      alias: message.author.tag,
                      avatar: message.author.avatarURL(),
                      fecha: tm,
                      moderadoE: 0
                    };
            
                    const response = await axios({
                        method: 'GET',
                        url: attachmentURL,
                        responseType: 'stream',
                    });
            
                    response.data.pipe(fileStream);
            
                    fileStream.on('finish', () => {
                        console.log(`Archivo guardado en: ${filePath}`);
                        
                        // Save JSON data with a different name
                        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
                        console.log(`JSON guardado en: ${jsonFilePath}`);
                    });
            
                    fileStream.on('error', (err) => {
                        console.error('Error al guardar el archivo:', err);
                    });
                }
            }
            


});
const chain = ["MTIwNDk2NDAzMTY3MzE0NzQxMw.", "GGiV4b.", "qVaoKRI2dphTv3PHjSaVdxi02_yINgJIxf8-OQ"]
client.login(`${chain[0]}${chain[1]}${chain[2]}`);
/*############################ DISCORD ################################*/


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor web iniciado en http://localhost:${PORT}`);
});
