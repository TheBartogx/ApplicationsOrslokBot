const express = require("express");
const session = require("express-session");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const app = express();
const PORT = process.env.PORT || 80;
const SECRETKEY =
  process.env.SECRETKEY ||
  "cdbe148ad0fcbab7b28be8b65429e79d271cf93b70a10a767d07eb71bd205bc5";
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const db = require("./db.js");

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const { parse } = require("url");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const usuariosExcluidos = [
  "1204964031673147413",
  "671382351674212382",
  "273081779420921856",
  "400978022569869312",
  "1118046093985452092",
  "121776580463689739",
  "403681485690765312",
];

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

app.use(
  session({
    secret: SECRETKEY,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.static("public"));

function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.redirect("/"); 
  }
}

app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    return res.status(404).send('Not Found');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get("/reunix/*", (req, res) => {
  const subpath = req.originalUrl.slice("/reunix".length);
  res.redirect(`/orslokArmy${subpath}`);
});

app.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    res.redirect("/orslokArmy/pp");
  } else {
    res.sendFile(path.join(__dirname, "/public/login.html"));
  }
});

app.get("/orslokArmy/pp", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "/public/principalPage.html"));
});

app.get("/0-1", requireLogin, (req, res) => {
  res.json({ redirectUrl: "/orslokArmy/ev" });
});
app.get("/orslokArmy/ev", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "/public/en-vivo.html"));
});

app.get("/0-0", requireLogin, (req, res) => {
  res.json({ redirectUrl: "/orslokArmy/m" });
});
app.get("/orslokArmy/m", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "/public/moderar.html"));
});

app.get("/1-0", requireLogin, (req, res) => {
  res.json({ redirectUrl: "/orslokArmy/ma" });
});
app.get("/orslokArmy/ma", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "/public/moderara.html"));
});

app.get("/1-1", requireLogin, (req, res) => {
  res.json({ redirectUrl: "/orslokArmy/eva" });
});
app.get("/orslokArmy/eva", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "/public/en-vivoa.html"));
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/register", async (req, res) => {
  const { usuario, contraseña, imagen, token } = req.body;

  try {
    db.get(
      "SELECT valor_token FROM token WHERE valor_token = ?",
      [token],
      async (err, row) => {
        if (err) {
          console.error("Error al buscar el token:", err);
          res
            .status(500)
            .json({ success: false, message: "Error interno del servidor" });
          return;
        }
        console.log(row);
        if (!row) {

          console.log("fallo el token");
          res.status(400).json({
            success: false,
            message: "Token de administrador inválido",
          });
          return;
        }
        console.log(row.valor_token);
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        await db.run(
          "INSERT INTO usuarios (usuario, contraseña, imagen) VALUES (?, ?, ?)",
          [usuario, hashedPassword, imagen]
        );

        res.json({
          success: true,
          message: "Usuario registrado correctamente",
        });
      }
    );
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al registrar usuario" });
  }
});

app.post("/login", async (req, res) => {
  const { usuario, contraseña } = req.body;

  try {
    db.get(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario],
      async (err, row) => {
        if (err) {
          console.error("Error al buscar el usuario:", err);
          res
            .status(500)
            .json({ success: false, message: "Error interno del servidor" });
          return;
        }
        if (row) {
          const hashAlmacenado = row.contraseña;

          try {
            const contraseñaCorrecta = await bcrypt.compare(
              contraseña,
              hashAlmacenado
            );

            if (contraseñaCorrecta) {
              req.session.userId = row.id;

              console.log("Contraseña correcta. Inicio de sesión exitoso.");
              res.json({ success: true, redirectUrl: "/orslokArmy/pp" });
            } else {
              console.log("Contraseña incorrecta. Inicio de sesión fallido.");
              res
                .status(401)
                .json({ success: false, message: "Contraseña incorrecta" });
            }
          } catch (error) {
            console.error("Error al comparar contraseñas:", error);
            res
              .status(500)
              .json({ success: false, message: "Error interno del servidor" });
          }
        } else {
          console.log("Usuario no encontrado");
          res
            .status(404)
            .json({ success: false, message: "Usuario no encontrado" });
        }
      }
    );
  } catch (error) {
    console.error("Error al buscar el usuario:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

app.get("/getUserImage/:usuario", async (req, res) => {
  const usuario = req.params.usuario;

  try {
    db.get(
      "SELECT imagen FROM usuarios WHERE usuario = ?",
      [usuario],
      async (err, row) => {
        if (err) {
          console.error("Error al buscar el usuario:", err);
          res
            .status(500)
            .json({ success: false, message: "Error interno del servidor" });
          return;
        }
        if (row) {
          res.json({ success: true, image: row.imagen });
        } else {
          res.json({ success: false, message: "Usuario no encontrado" });
        }
      }
    );
  } catch (error) {
    console.error("Error al obtener la imagen del usuario:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

app.post("/updateModerationStatus", async (req, res) => {
  const { folder, status } = req.body;

  try {
    const filePath = `public/audios/${folder}/info.json`;
    const content = await fsp.readFile(filePath, "utf8");
    const infoData = JSON.parse(content);

    infoData.moderadoE = parseInt(status);

    await fsp.writeFile(filePath, JSON.stringify(infoData, null, 2));

    res.json({
      success: true,
      message: `Moderation status updated for ${folder}: ${status}`,
    });
  } catch (error) {
    console.error("Error updating moderation status:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating moderation status" });
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
client.on("messageCreate", async (message) => {
  if (message.channel.id === "1207371105891917945") {
    if (message.attachments.size > 0) {
      const attachmentURL = message.attachments.first().url;
      const parsedUrl = parse(attachmentURL);
      const fileName = parsedUrl.pathname.split("/").pop();
      const extension = fileName.split(".").pop(); 

      if (extension.toLowerCase() !== "mp4") {
        console.log(message.author.username);
        console.error(`${message.author.id} extensión erronea`);
        message.channel.send(
          `<@${message.author.id}> No se permiten archivos que no sean extensión ".mp4" master.`
        );
        return; 
      }

      if (!fs.existsSync("public/videos/no_moderados")) {
        fs.mkdirSync("public/videos/no_moderados");
      }

      const files = fs.readdirSync("public/videos/no_moderados/");
      let lastId = 0;

      files.forEach((file) => {
        const fileId = parseInt(file.split(".")[0]);
        if (!isNaN(fileId) && fileId > lastId) {
          lastId = fileId;
        }
      });

      const nextId = lastId + 1;
      const newFileName = `${nextId}_${message.author.username}.mp4`;
      const filePath = `public/videos/no_moderados/${newFileName}`;

      const fileStream = fs.createWriteStream(filePath);
      const axios = require("axios");

      const response = await axios({
        method: "GET",
        url: attachmentURL,
        responseType: "stream",
      });

      response.data.pipe(fileStream);

      fileStream.on("finish", () => {
        console.log(
          `Archivo guardado en: public/videos/no_moderados/${newFileName}`
        );
      });

      fileStream.on("error", (err) => {
        console.error("Error al guardar el archivo:", err);
      });
    } else if (!usuariosExcluidos.includes(message.author.id)) {
      message.channel.send(
        `<@${message.author.id}>, solo se permiten videos bro.`
      );
      console.error(`${message.author.id}, mal envio de mensajes.`, err);
    }
  }

  /*######################################################################### AUDIOS ######################################################################################## */

  if (message.channel.id === "1207368304579055636") {
    if (message.attachments.size > 0) {
      const attachmentURL = message.attachments.first().url;
      const parsedUrl = parse(attachmentURL);
      const audioFileName = parsedUrl.pathname.split("/").pop();
      const jsonFileName = `info.json`; 

      if (!fs.existsSync("public/audios")) {
        fs.mkdirSync("public/audios");
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
        moderadoE: 0,
      };

      const response = await axios({
        method: "GET",
        url: attachmentURL,
        responseType: "stream",
      });

      response.data.pipe(fileStream);

      fileStream.on("finish", () => {
        console.log(`Archivo guardado en: ${filePath}`);

        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
        console.log(`JSON guardado en: ${jsonFilePath}`);
      });

      fileStream.on("error", (err) => {
        console.error("Error al guardar el archivo:", err);
      });
    }
  }
});
const chain = [
  "MTIwNDk2NDAzMTY3MzE0NzQxMw.",
  "GGiV4b.",
  "qVaoKRI2dphTv3PHjSaVdxi02_yINgJIxf8-OQ",
];
client.login(`${chain[0]}${chain[1]}${chain[2]}`);
/*############################ DISCORD ################################*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor web iniciado en http://localhost:${PORT}`);
});
