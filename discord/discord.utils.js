import fetch from 'node-fetch';
import { verifyKey } from 'discord-interactions';
import Commands from "../commands.json" assert { type: "json" };

export function VerifyDiscordRequest(clientKey) {
    return function (req, res, buf, encoding) {
      const signature = req.get('X-Signature-Ed25519');
      const timestamp = req.get('X-Signature-Timestamp');      
      const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
      if (!isValidRequest) {
        res.status(401).send('Bad request signature');
        throw new Error('Bad request signature');
      }
    };
  }

export async function DiscordRequest(endpoint, options) {
    // Append endpoint to root API URL
    const url = 'https://discord.com/api/v10/' + endpoint;    
    // Stringify payloads
    if (options.body) options.body = JSON.stringify(options.body);
        //Use node-fetch to make requests
        const res = await fetch(url, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
                'Content-type': 'application/json; charset=UTF-8',
                'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)'
            },
            ...options
        });

        // Throw API errors
        if (!res.ok) {
            const data = await res.json();
            console.log(res.status);
            throw new Error(JSON.stringify(data));
        }
        //return original response
        return res;
}

// Command tools
export async function HasGuildCommands (appId, guildId, commands) {
  if (guildId === '' || appId === '') return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand (appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
      const res = await DiscordRequest (endpoint, {method: 'GET'});
      const data = res ? await res.json() : null;

      if (data) {
          const installedNames = data.map((c) => c['name']);
          // This is just matching on the name, so it's not good for updates
          if (!installedNames.includes(command['name'])) {
              console.log(`Instalando "${command['name']}"`);
              InstallGuildCommand (appId, guildId, command);                
          } else {
              console.log(`"${command['name']}" já está instalado`);
          }
      }
  } catch (err) {
      console.error(err);
  }
}

// Gets all commands
export function GetMyGuildCommands() {
  const {commands} = Commands;
  const commandsName = commands.map((c) => c['command']);
  return commands;
}

// Get command
export function GetCommandContentByName(name) {
  const command = GetMyGuildCommands().find((c) => c['name'] === name);
  return command['data']['content'];
}

// Installs a command
export async function InstallGuildCommand (appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  // Install command
  try {
      await DiscordRequest (endpoint, { method: 'POST', body: command });
  } catch (err) {
      console.error(err);
  }
}

