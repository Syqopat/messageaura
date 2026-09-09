const Bot = require("./Bot");

class BotManager {
  constructor(io) {
    this.io = io;
    this.bots = new Map();
  }

  createBot(options) {
    const bot = new Bot(options, this.io);
    this.bots.set(bot.id, bot);
    this.emitBotsList();
    return bot;
  }

  getBot(id) {
    return this.bots.get(id);
  }

  removeBot(id) {
    const bot = this.bots.get(id);
    if (bot) {
      bot.disconnect();
      this.bots.delete(id);
      this.emitBotsList();
    }
  }

  getAllBotsData() {
    return Array.from(this.bots.values()).map((bot) => bot.getPublicData());
  }

  emitBotsList() {
    this.io.emit("bots_list", this.getAllBotsData());
  }

  sayAll(message) {
    this.bots.forEach((bot) => {
      bot.say(message);
    });
  }

  startRandomMovementAll() {
    this.bots.forEach((bot) => {
      bot.startRandomMovement();
    });
  }

  stopRandomMovementAll() {
    this.bots.forEach((bot) => {
      bot.stopRandomMovement();
    });
  }

  disconnectAll() {
    this.bots.forEach((bot) => {
      bot.disconnect();
    });
  }

  startSpammerAll(message, interval) {
    this.bots.forEach((bot) => {
      bot.startSpammer(message, interval);
    });
  }

  stopSpammerAll() {
    this.bots.forEach((bot) => {
      bot.stopSpammer();
    });
  }

  blockPlayerAll(name) {
    this.bots.forEach((bot) => {
      bot.blockPlayer(name);
    });
  }

  unblockPlayerAll(name) {
    this.bots.forEach((bot) => {
      bot.unblockPlayer(name);
    });
  }

  reconnectAll(newHost) {
    this.bots.forEach((bot) => {
      try {
        bot.reconnectTo(newHost);
      } catch (err) {}
    });
  }

  removeAllBots() {
    this.bots.forEach((bot) => {
      try {
        bot.disconnect();
      } catch (err) {}
    });
    this.bots.clear();
    this.emitBotsList();
  }
}

module.exports = BotManager;
