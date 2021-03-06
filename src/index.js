"use strict";

const ViberBot = require("viber-bot").Bot;
const BotEvents = require("viber-bot").Events;

// const TextMessage = require("viber-bot").Message.Text;

const say = require("./viber_response").say;
const processResponse = require("./viber_response").processResponse;

require("dotenv").config();

const winston = require("winston");
const toYAML = require("winston-console-formatter");
const ngrok = require("./get_public_url");

var request = require("request");

function createLogger() {
  const logger = new winston.Logger({
    level: "debug", // We recommend using the debug level for development
  });

  logger.add(winston.transports.Console, toYAML.config());
  return logger;
}

const logger = createLogger();

if (!process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY) {
  logger.debug(
    "Could not find the Viber account access token key in your environment variable. Please make sure you followed readme guide."
  );
  return;
}

// Creating the bot with access token, name and avatar
const bot = new ViberBot(logger, {
  authToken: process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY, // Learn how to get your access token at developers.viber.com
  name: "Is It Up",
  avatar: "https://raw.githubusercontent.com/devrelv/drop/master/151-icon.png", // Just a placeholder avatar to display the user
});

// The user will get those messages on first registration
bot.onSubscribe((response) => {
  say(
    response,
    `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`
  );
});

// bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
//   // This sample bot can answer only text messages, let's make sure the user is aware of that.
//   if (!(message instanceof TextMessage)) {
//     say(response, `Sorry. I can only understand text messages.`);
//   }
// });

bot.onTextMessage(/./, (message, botResponse) => {
  // checkUrlAvailability(response, message.text);
  // botResponse.send(
  //   new TextMessage(`Message received. Djesi Hide sta te boli?`)
  // );
  // say(botResponse, `hi to you too.`);
  processResponse(botResponse, message.text);
  logger.debug(`message send from on text message line 61.`);
});

if (process.env.NOW_URL || process.env.HEROKU_URL) {
  const http = require("http");
  const port = process.env.PORT || 8080;

  http
    .createServer(bot.middleware())
    .listen(port, () =>
      bot.setWebhook(process.env.NOW_URL || process.env.HEROKU_URL)
    );
} else {
  logger.debug(
    "Could not find the now.sh/Heroku environment variables. Trying to use the local ngrok server."
  );
  const http = require("http");
  const port = process.env.PORT || 8080;
  return ngrok
    .getPublicUrl()
    .then((publicUrl) => {
      console.log('Set the new webhook to"', publicUrl);
      http
        .createServer(bot.middleware())
        .listen(port, () => bot.setWebhook(publicUrl));
    })
    .catch((error) => {
      console.log("Can not connect to ngrok server. Is it running?");
      console.error(error);
    });
}
