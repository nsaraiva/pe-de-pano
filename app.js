import express from "express";
import { VerifyDiscordRequest, HasGuildCommands, GetMyGuildCommands, GetCommandContentByName } from "./discord/discord.utils.js";
import { Teste, getPixzaPrice } from "./discord/discord.commands.js";
import {
    InteractionType,
    InteractionResponseType,
    InteractionResponseFlags,
    MessageComponentTypes,
    ButtonStyleTypes,
  } from "discord-interactions";
import dotenv from "dotenv";
dotenv.config()

// Create an express app
const app = express();
// Get port, or default to 3000
const port = process.env.PORT || 3000;

// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));


app.post("/interactions", async function (req, res){
    const { type, id, data} = req.body;

    // Handle verification requests
    if (type === InteractionType.PING) {
        res.send({ type: InteractionResponseType.PONG });
    }

    // Handle slash command requests
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name} = data;

        res.send({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: await eval(GetCommandContentByName(name)),
            },
        });
    }
});

app.listen(port, () =>{
    console.log(`Listening on port ${port}`);

    // Check if guild commands from commands.json are installed (if not, install them)
    HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, GetMyGuildCommands());
});