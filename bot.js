const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
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
        console.error(`${message.author.id} extensión erronea`, err);
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
      const newFileName = `${nextId}.mp4`;
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