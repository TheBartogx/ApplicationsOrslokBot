const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const { parse } = require('url');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.attachments.size > 0) {
    const attachmentURL = message.attachments.first().url;
    const parsedUrl = parse(attachmentURL);
    const fileName = parsedUrl.pathname.split('/').pop();

    if (!fs.existsSync('audios')) {
      fs.mkdirSync('audios');
    }

    let userFolder;

    if (message.guild) {
      // Si el mensaje proviene de un canal de servidor (GuildChannel)
      userFolder = `audios/${message.author.username}`;
    } else {
      // Si el mensaje proviene de un mensaje directo (DMChannel)
      userFolder = `audios/DMs/${message.author.username}`;
    }

    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder);
    }

    const filePath = `${userFolder}/${fileName}`;

    const fileStream = fs.createWriteStream(filePath);
    const axios = require('axios');

    const response = await axios({
      method: 'GET',
      url: attachmentURL,
      responseType: 'stream',
    });

    response.data.pipe(fileStream);

    fileStream.on('finish', () => {
      console.log(`Archivo guardado en: ${filePath}`);
    });

    fileStream.on('error', (err) => {
      console.error('Error al guardar el archivo:', err);
    });
  }
});

// Reemplaza 'TOKEN' con el token de tu bot
client.login('MTIwNDk2NDAzMTY3MzE0NzQxMw.GsX0_W.uSF0m-xw0aFjAtesDgnBgCU7kX37TcQiWBl5do');
