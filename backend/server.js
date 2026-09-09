const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const BotManager = require("./BotManager");

process.on("uncaughtException", (err) => {
  console.error("Kritik Hata (Uncaught Exception):", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Kritik Hata (Unhandled Rejection):", reason);
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

const botManager = new BotManager(io);

io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);

  
  socket.emit("bots_list", botManager.getAllBotsData());

  socket.on("create_bot", (data) => {
    botManager.createBot(data);
  });

  socket.on("remove_bot", (id) => {
    botManager.removeBot(id);
  });

  socket.on("remove_all_bots", () => {
    botManager.removeAllBots();
  });

  
  socket.on("bot_action", ({ id, action, data }) => {
    const bot = botManager.getBot(id);
    if (!bot) return;

    switch (action) {
      case "say":
        bot.say(data);
        break;
      case "jump":
        bot.jump();
        break;
      case "start_random":
        bot.startRandomMovement();
        break;
      case "stop_random":
        bot.stopRandomMovement();
        break;
      case "disconnect":
        bot.disconnect();
        break;
      case "reconnect":
        bot.reconnectTo(data); 
        break;
      case "set_control_state":
        bot.setControlState(data.state, data.value);
        break;
      case "look":
        bot.look(data.deltaYaw, data.deltaPitch);
        break;
      case "look_absolute":
        bot.lookAbsolute(data.yaw, data.pitch);
        break;
      case "joystick_move":
        if (data) {
          const threshold = 0.3;
          bot.setControlState("forward", data.moveY < -threshold);
          bot.setControlState("back", data.moveY > threshold);
          bot.setControlState("left", data.moveX < -threshold);
          bot.setControlState("right", data.moveX > threshold);
        }
        break;
      case "joystick_stop":
        bot.setControlState("forward", false);
        bot.setControlState("back", false);
        bot.setControlState("left", false);
        bot.setControlState("right", false);
        break;
      case "set_control":
        bot.setControlState(data.state, data.value);
        break;
      case "left_click":
        if (bot.leftClick) bot.leftClick();
        break;
      case "right_click":
        if (bot.rightClick) bot.rightClick();
        break;
      case "drop_item":
        if (bot.dropItem) bot.dropItem();
        break;
      case "set_hotbar_slot":
        if (bot.setHotbarSlot) bot.setHotbarSlot(data.slot);
        break;
      case "inventory_click":
        if (bot.inventoryClick)
          bot.inventoryClick(data.slot, data.mouseButton, data.mode);
        break;
      case "close_window":
        if (bot.closeWindow) bot.closeWindow();
        break;
      case "add_auto_task":
        if (bot.addAutoTask) bot.addAutoTask(data.taskId, data.cmd, data.delay);
        break;
      case "remove_auto_task":
        if (bot.removeAutoTask) bot.removeAutoTask(data.taskId);
        break;
      case "toggle_autoclicker":
        if (bot.toggleAutoClicker)
          bot.toggleAutoClicker(data.button, data.delay);
        break;
      case "toggle_autoattack":
        if (bot.toggleAutoAttack) bot.toggleAutoAttack(data?.delay);
        break;
      case "block_player":
        if (bot.blockPlayer) bot.blockPlayer(data);
        break;
      case "unblock_player":
        if (bot.unblockPlayer) bot.unblockPlayer(data);
        break;
      case "start_spammer":
        if (bot.startSpammer) bot.startSpammer(data.message, data.interval);
        break;
      case "stop_spammer":
        if (bot.stopSpammer) bot.stopSpammer();
        break;
      case "request_players":
        if (bot.emitPlayers) bot.emitPlayers();
        break;
    }
  });

  socket.on("global_action", ({ action, data }) => {
    switch (action) {
      case "say":
        botManager.sayAll(data);
        break;
      case "start_random":
        botManager.startRandomMovementAll();
        break;
      case "stop_random":
        botManager.stopRandomMovementAll();
        break;
      case "disconnect":
        botManager.disconnectAll();
        break;
      case "reconnect":
        botManager.reconnectAll(data);
        break;
      case "start_spammer":
        botManager.startSpammerAll(data.message, data.interval);
        break;
      case "stop_spammer":
        botManager.stopSpammerAll();
        break;
      case "block_player":
        botManager.blockPlayerAll(data);
        break;
      case "unblock_player":
        botManager.unblockPlayerAll(data);
        break;
    }
  });

  socket.on("disconnect", () => {
    console.log("Frontend disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
