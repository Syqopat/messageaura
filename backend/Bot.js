const mineflayer = require("mineflayer");
const { v4: uuidv4 } = require("uuid");
const Vec3 = require("vec3").Vec3;
const mineflayerViewer = require("prismarine-viewer").mineflayer;
const fs = require("fs");
const path = require("path");
const { SocksProxyAgent } = require("socks-proxy-agent");

let nextViewerPort = 4000;

class Bot {
  constructor(options, io) {
    this.id = uuidv4();
    this.username = options.username;

    let parsedHost = options.host || "localhost";
    let parsedPort = undefined;

    if (parsedHost.includes(":")) {
      const parts = parsedHost.split(":");
      parsedHost = parts[0];
      parsedPort = parseInt(parts[1], 10);
    } else if (options.port) {
      parsedPort = parseInt(options.port, 10);
    }

    this.host = parsedHost;
    this.port = parsedPort;
    this.version = "1.20.1"; 
    this.viewerPort = null;
    this.io = io;
    this.macros = options.macros || [];
    this.proxy = options.proxy || null;
    this.brand = options.brand || "vanilla";

    this.status = "connecting";
    this.moveInterval = null;
    this.positionInterval = null;
    this.chunkInterval = null;
    this.lastScanCenter = null; 

    
    this.autoReconnect = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.intentionalDisconnect = false;
    this.reconnectTimeout = null;

    
    this.autoTasks = {}; 
    this.autoClickerLeft = null;
    this.autoClickerRight = null;
    this.autoAttackTimer = null;

    this.loadConfig();
    this.init();
  }

  init() {
    try {
      this.viewerPort = nextViewerPort++;

      let agent = null;
      let connectFn = undefined;
      if (this.proxy) {
        let proxyUrl = this.proxy.trim();
        if (!proxyUrl.includes("://")) {
          proxyUrl = "socks5://" + proxyUrl;
        }
        agent = new SocksProxyAgent(proxyUrl);

        try {
          const parsedUrl = new URL(proxyUrl);
          const proxyHost = parsedUrl.hostname;
          const proxyPort = parseInt(parsedUrl.port, 10) || 1080;
          const proxyType = parsedUrl.protocol.startsWith("socks4") ? 4 : 5;

          const socks = require("socks").SocksClient;
          const net = require("net");
          const dns = require("dns");

          connectFn = (client) => {
            const destHost = this.host;
            const destPort = this.port || 25565;

            if (net.isIP(destHost) === 0 && destHost !== "localhost" && !this.port) {
              dns.resolveSrv("_minecraft._tcp." + destHost, (dnsErr, addresses) => {
                let finalHost = destHost;
                let finalPort = destPort;

                if (!dnsErr && addresses && addresses.length > 0) {
                  finalHost = addresses[0].name;
                  finalPort = addresses[0].port;
                }

                socks.createConnection({
                  proxy: {
                    host: proxyHost,
                    port: proxyPort,
                    type: proxyType
                  },
                  command: "connect",
                  destination: {
                    host: finalHost,
                    port: finalPort
                  }
                }, (err, info) => {
                  if (err) {
                    client.emit("error", err);
                    return;
                  }
                  client.setSocket(info.socket);
                  client.emit("connect");
                });
              });
            } else {
              socks.createConnection({
                proxy: {
                  host: proxyHost,
                  port: proxyPort,
                  type: proxyType
                },
                command: "connect",
                destination: {
                  host: destHost,
                  port: destPort
                }
              }, (err, info) => {
                if (err) {
                  client.emit("error", err);
                  return;
                }
                client.setSocket(info.socket);
                client.emit("connect");
              });
            }
          };
        } catch (e) {
          this.log(`Proxy parse hatası: ${e.message}`);
        }
      }

      this.bot = mineflayer.createBot({
        host: this.host,
        port: this.port,
        username: this.username,
        version: this.version,
        auth: "offline",
        checkTimeoutInterval: 60000,
        agent: agent || undefined,
        brand: this.brand || "vanilla",
        connect: connectFn || undefined,
      });

      this.setupEvents();
    } catch (error) {
      this.status = "error";
      this.emitUpdate({ error: error.message });
    }
  }

  setupEvents() {
    const brandChannel = (this.bot.supportFeature && this.bot.supportFeature("customChannelMCPrefixed")) ? "MC|Brand" : "minecraft:brand";

    try {
      this.bot._client.registerChannel(brandChannel, ["string", []]);
    } catch (e) {}

    try {
      if (this.brand === "lunarclient") {
        this.bot._client.registerChannel("lunarclient:pm");
      } else if (this.brand === "badlion") {
        this.bot._client.registerChannel("badlion:mods");
      } else if (this.brand === "labymod") {
        this.bot._client.registerChannel("labymod3:main");
      }
    } catch (e) {}

    this.bot._client.on(brandChannel, () => {
      try {
        this.bot._client.writeChannel(brandChannel, this.brand || "vanilla");
      } catch (err) {}
    });

    this.bot._client.on("packet", (data, metadata) => {
      if (metadata.name && (metadata.name.includes("custom") || metadata.name.includes("payload") || metadata.name.includes("brand"))) {
        this.log(`Paket: ${metadata.name} | Kanal: ${data.channel || "Yok"} | Veri: ${data.data ? data.data.toString("hex").substring(0, 64) : "Yok"}`);
      }
    });

    this.bot.on("login", () => {
      this.status = "online";
      this.reconnectAttempts = 0;
      this.emitUpdate();
      this.log("Sunucuya bağlanıldı.");
    });

    this.bot.on("spawn", () => {
      this.log("Dünyada doğuldu.");
      this.lastScanCenter = null;

      
      if (!this.bot.viewer) {
        try {
          mineflayerViewer(this.bot, {
            port: this.viewerPort,
            firstPerson: true,
          });
          this.log(
            `3D Görüntüleyici port ${this.viewerPort} üzerinde başlatıldı.`,
          );
        } catch (e) {
          this.log(`Viewer başlatılamadı: ${e.message}`);
        }
      }
      this.emitUpdate();

      
      if (this.macros && this.macros.length > 0) {
        this.log(`Makrolar çalıştırılıyor (${this.macros.length} adet)...`);
        this.macros.forEach((cmd, index) => {
          setTimeout(
            () => {
              if (this.status === "online") {
                this.say(cmd);
              }
            },
            (index + 1) * 2000,
          );
        });
      }

      
      if (this.bot.inventory) {
        this.bot.inventory.on("updateSlot", () => {
          this.emitInventory();
        });
      }
      this.emitInventory();
      this.emitPlayers();
      this.startPositionBroadcast();
      this.startChunkBroadcast();
    });

    this.bot.on("playerJoined", () => {
      this.emitPlayers();
    });

    this.bot.on("playerLeft", () => {
      this.emitPlayers();
    });

    this.bot.on("chat", (username, message) => {
      if (username === this.bot.username) return;
      if (this.blockedPlayers.includes(username)) return;
      this.emitChat(username, message);
    });

    this.bot.on("message", (jsonMsg, position) => {
      const message = jsonMsg.toString();
      if (message.trim() !== "") {
        let isBlockedWhisper = false;
        const whisperPatterns = [
          /^\[(.+?) -> .+?\](.*)$/,
          /^\((.+?) -> .+?\)(.*)$/,
          /^(.+?) whispers to you:(.*)$/,
          /^\[(.+?)\] whispers(.*)$/,
          /^(.+?) -> (?:you|sen):(.*)$/
        ];
        for (const pattern of whisperPatterns) {
          const match = message.match(pattern);
          if (match) {
            let sender = match[1];
            sender = sender.replace(/§./g, "").trim();
            if (this.blockedPlayers.includes(sender)) {
              isBlockedWhisper = true;
              break;
            }
          }
        }
        if (isBlockedWhisper) {
          return;
        }
        this.emitChat("SYSTEM", message);
      }
    });

    const parseKickReason = (reason) => {
      try {
        if (typeof reason === "string") {
          const parsed = JSON.parse(reason);
          reason = parsed;
        }
      } catch (e) {}

      if (typeof reason === "object" && reason !== null) {
        if (
          reason.type === "compound" &&
          reason.value &&
          reason.value.text &&
          reason.value.text.value
        ) {
          return reason.value.text.value;
        }
        let text = reason.text || "";
        if (reason.extra && Array.isArray(reason.extra)) {
          reason.extra.forEach((item) => {
            if (item.text) text += item.text;
            else if (typeof item === "string") text += item;
          });
        }
        if (text) return text;
        if (
          typeof reason.toString === "function" &&
          reason.toString() !== "[object Object]"
        ) {
          return reason.toString();
        }
        const str = JSON.stringify(reason);
        const matches =
          str.match(/"text":"([^"]+)"/g) || str.match(/"value":"([^"]+)"/g);
        if (matches) {
          return matches.map((m) => m.split(':"')[1].slice(0, -1)).join(" ");
        }
        return str;
      }
      return String(reason);
    };

    this.bot.on("kicked", (reason) => {
      this.status = "disconnected";
      const parsedReason = parseKickReason(reason);
      this.log(`Sunucudan atıldı: ${parsedReason}`);
      this.emitUpdate();
      this.cleanup();

      // Eğer proxy bizi çok hızlı girdiğimiz için atıyorsa bekleme süresini artır
      const lowerReason = parsedReason.toLowerCase();
      if (
        lowerReason.includes("hızlı") ||
        lowerReason.includes("proxy") ||
        lowerReason.includes("zaten bağlısınız")
      ) {
        this.log("Proxy koruması algılandı, bekleme süresi artırılıyor...");
        this.reconnectAttempts = Math.max(this.reconnectAttempts, 2); // En az 15 sn beklemesi için attempt'i yükselt
      } else if (
        lowerReason.includes("dahili bir hata") ||
        lowerReason.includes("internal error") ||
        lowerReason.includes("internal exception")
      ) {
        this.log(
          "Proxy dimension geçiş hatası algılandı, anında yeniden bağlanılıyor...",
        );
        this.reconnectAttempts = 0; 
      }

      this.attemptReconnect();
    });

    this.bot.on("error", (err) => {
      this.status = "error";
      this.log(`Hata: ${err.message}`);
      this.emitUpdate();
      this.cleanup();
    });

    this.bot.on("end", (reason) => {
      this.status = "disconnected";
      this.log(`Bağlantı kesildi: ${reason || "bilinmeyen sebep"}`);
      this.emitUpdate();
      this.cleanup();
      if (!this.intentionalDisconnect) {
        this.attemptReconnect();
      }
    });

    
    this.bot.on("windowOpen", (window) => {
      this.emitInventory();
      this.io.emit("window_opened", { id: this.id });
      window.on("updateSlot", () => {
        this.emitInventory();
      });
    });

    this.bot.on("windowClose", () => {
      this.emitInventory();
    });

    
    this.bot.on("death", () => {
      this.log("Bot öldü, otomatik yeniden doğuluyor...");
      this.emitUpdate();
    });

    
    const emitScoreboard = () => {
      if (!this.bot || !this.bot.scoreboards) return;
      const scoreboards = this.bot.scoreboards;
      const sidebar = Object.values(scoreboards).find(
        (sb) => sb.position === 1,
      ); 
      if (sidebar) {
        
        const items = sidebar.items
          .map((i) => ({
            name: i.displayName?.toString() || i.name,
            value: i.value,
          }))
          .sort((a, b) => b.value - a.value);
        this.io.emit("bot_scoreboard", {
          id: this.id,
          title: sidebar.title || sidebar.name,
          items,
        });
      } else {
        this.io.emit("bot_scoreboard", { id: this.id, title: null, items: [] });
      }
    };

    this.bot.on("scoreboardCreated", emitScoreboard);
    this.bot.on("scoreboardUpdated", emitScoreboard);
    this.bot.on("scoreUpdated", emitScoreboard);
    this.bot.on("scoreboardPosition", emitScoreboard);
    this.bot.on("scoreboardDeleted", () => {
      this.io.emit("bot_scoreboard", { id: this.id, title: null, items: [] });
    });
  }

  attemptReconnect() {
    if (!this.autoReconnect || this.intentionalDisconnect) return;
    if (this.isReconnecting) return; 

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log(
        `Maksimum yeniden bağlanma denemesi (${this.maxReconnectAttempts}) aşıldı.`,
      );
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    const delay = Math.min(5000 + this.reconnectAttempts * 5000, 45000); 
    this.log(
      `${delay / 1000}s sonra yeniden bağlanılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      if (this.intentionalDisconnect) return;
      this.status = "connecting";
      this.emitUpdate();
      this.lastScanCenter = null;
      this.init();
    }, delay);
  }

  
  reconnectTo(newHost) {
    let parsedHost = newHost || this.host;
    let parsedPort = undefined;

    if (parsedHost.includes(":")) {
      const parts = parsedHost.split(":");
      parsedHost = parts[0];
      parsedPort = parseInt(parts[1], 10);
    }

    this.host = parsedHost;
    this.port = parsedPort;
    this.intentionalDisconnect = false;
    this.autoReconnect = true;
    this.reconnectAttempts = 0;

    
    if (
      this.bot &&
      (this.status === "online" || this.status === "connecting")
    ) {
      this.bot.quit();
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.cleanup();
    this.status = "connecting";
    this.emitUpdate();
    this.lastScanCenter = null;
    this.init();
  }

  

  startPositionBroadcast() {
    if (this.positionInterval) clearInterval(this.positionInterval);

    this.positionInterval = setInterval(() => {
      if (!this.bot || !this.bot.entity || this.status !== "online") return;

      const pos = this.bot.entity.position;
      this.io.emit("bot_position", {
        id: this.id,
        x: Math.round(pos.x * 100) / 100,
        y: Math.round(pos.y * 100) / 100,
        z: Math.round(pos.z * 100) / 100,
        yaw: this.bot.entity.yaw,
        pitch: this.bot.entity.pitch,
      });
    }, 200); 
  }

  startChunkBroadcast() {
    if (this.chunkInterval) clearInterval(this.chunkInterval);

    this.sendSurroundingBlocks();

    
    this.chunkInterval = setInterval(() => {
      if (!this.bot || !this.bot.entity || this.status !== "online") return;
      this.sendSurroundingBlocks();
    }, 3000); 
  }

  sendSurroundingBlocks() {
    if (!this.bot || !this.bot.entity) return;

    try {
      const pos = this.bot.entity.position;
      const centerX = Math.floor(pos.x);
      const centerY = Math.floor(pos.y);
      const centerZ = Math.floor(pos.z);

      
      if (this.lastScanCenter) {
        const dx = Math.abs(centerX - this.lastScanCenter.x);
        const dz = Math.abs(centerZ - this.lastScanCenter.z);
        if (dx < 8 && dz < 8) return; 
      }
      this.lastScanCenter = { x: centerX, y: centerY, z: centerZ };

      const RADIUS = 24; 
      const blocks = {};
      let blockCount = 0;

      
      const minY = Math.max(centerY - 16, -64);
      const maxY = Math.min(centerY + 32, 320);

      for (let x = centerX - RADIUS; x <= centerX + RADIUS; x++) {
        for (let z = centerZ - RADIUS; z <= centerZ + RADIUS; z++) {
          for (let y = minY; y <= maxY; y++) {
            try {
              const block = this.bot.blockAt(new Vec3(x, y, z));
              if (block && block.type !== 0) {
                const key = `${x},${y},${z}`;
                blocks[key] = {
                  name: block.name,
                };
                blockCount++;
              }
            } catch (e) {
              
            }
          }
        }
      }

      if (blockCount > 0) {
        this.io.emit("bot_world_blocks", {
          id: this.id,
          blocks: blocks,
          centerX,
          centerY,
          centerZ,
        });
      }
    } catch (err) {
      
    }
  }

  

  cleanup() {
    this.stopSpammer();
    this.stopRandomMovement();
    this.stopAllAutoTasks();
    this.stopAutoClicker("left");
    this.stopAutoClicker("right");
    this.stopAutoAttack();

    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
    if (this.chunkInterval) {
      clearInterval(this.chunkInterval);
      this.chunkInterval = null;
    }
  }

  log(message) {
    this.io.emit("bot_log", {
      id: this.id,
      message: `[${new Date().toLocaleTimeString()}] ${message}`,
    });
  }

  emitUpdate(extra = {}) {
    this.io.emit("bot_updated", this.getPublicData());
  }

  emitChat(username, message) {
    this.io.emit("bot_chat", { id: this.id, username, message });
  }

  getPublicData() {
    return {
      id: this.id,
      username: this.username,
      host: this.host,
      port: this.port,
      version: this.version,
      status: this.status,
      viewerPort: this.viewerPort,
      blockedPlayers: this.blockedPlayers || [],
      spammerActive: this.spammerActive || false,
      spammerMessage: this.spammerMessage || "Selam!",
      spammerInterval: this.spammerInterval || 10,
      proxy: this.proxy,
      brand: this.brand,
    };
  }

  
  say(message) {
    if (this.bot && this.status === "online") {
      if (message.startsWith(".")) {
        const parts = message.trim().split(" ");
        const cmd = parts[0].toLowerCase();
        if (cmd === ".engel") {
          const target = parts[1];
          if (target) {
            this.blockPlayer(target);
          } else {
            this.log("Kullanim: .engel <isim>");
          }
          return;
        } else if (cmd === ".engelkaldir") {
          const target = parts[1];
          if (target) {
            this.unblockPlayer(target);
          } else {
            this.log("Kullanim: .engelkaldir <isim>");
          }
          return;
        } else if (cmd === ".engelliler") {
          if (this.blockedPlayers.length === 0) {
            this.log("Engellenen oyuncu yok.");
          } else {
            this.log("Engellenen Oyuncular: " + this.blockedPlayers.join(", "));
          }
          return;
        } else if (cmd === ".spammer") {
          const msg = parts.slice(1).join(" ");
          if (msg) {
            this.startSpammer(msg, this.spammerInterval);
          } else {
            this.log("Kullanim: .spammer <mesaj>");
          }
          return;
        } else if (cmd === ".spammerdurdur") {
          this.stopSpammer();
          return;
        } else if (cmd === ".spammersure") {
          const sec = parseInt(parts[1], 10);
          if (!isNaN(sec) && sec > 0) {
            this.spammerInterval = sec;
            this.saveConfig();
            this.log("Spammer suresi " + sec + " saniye olarak ayarlandi.");
            if (this.spammerActive) {
              this.startSpammer(this.spammerMessage, sec);
            } else {
              this.emitUpdate();
            }
          } else {
            this.log("Kullanim: .spammersure <saniye>");
          }
          return;
        }
      }

      if (message.startsWith("/")) {
        try {
          this.bot.clearControlStates();
          this.bot.physicsEnabled = false;
          setTimeout(() => {
            if (this.bot) this.bot.physicsEnabled = true;
          }, 5000); 
        } catch (e) {}
      }

      this.bot.chat(message);
      this.log(`[Sen]: ${message}`);
    }
  }

  jump() {
    if (this.bot && this.status === "online") {
      this.bot.setControlState("jump", true);
      setTimeout(() => {
        if (this.bot) this.bot.setControlState("jump", false);
      }, 500);
      this.log("Zıpladı.");
    }
  }

  setControlState(state, value) {
    if (this.bot && this.status === "online") {
      try {
        this.bot.setControlState(state, value);
      } catch (e) {}
    }
  }

  look(deltaYaw, deltaPitch) {
    if (this.bot && this.status === "online") {
      const newYaw = this.bot.entity.yaw + deltaYaw;
      const newPitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, this.bot.entity.pitch + deltaPitch),
      );
      this.bot.look(newYaw, newPitch, true);
    }
  }

  lookAbsolute(yaw, pitch) {
    if (this.bot && this.status === "online") {
      this.bot.look(
        yaw,
        Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)),
        true,
      );
    }
  }

  startRandomMovement() {
    if (!this.bot || this.status !== "online") return;
    if (this.moveInterval) return;

    this.log("Rastgele hareket başlatıldı.");
    const actions = ["forward", "back", "left", "right", "jump"];

    this.moveInterval = setInterval(() => {
      if (this.status !== "online") {
        this.stopRandomMovement();
        return;
      }
      actions.forEach((action) => this.bot.setControlState(action, false));
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      this.bot.setControlState(randomAction, true);
      const yaw = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * Math.PI;
      this.bot.look(yaw, pitch, true);
      setTimeout(
        () => {
          if (this.bot && this.status === "online") {
            this.bot.setControlState(randomAction, false);
          }
        },
        1000 + Math.random() * 2000,
      );
    }, 5000);
  }

  stopRandomMovement() {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
      this.log("Rastgele hareket durduruldu.");

      if (this.bot && this.status === "online") {
        const actions = ["forward", "back", "left", "right", "jump"];
        actions.forEach((action) => {
          try {
            this.bot.setControlState(action, false);
          } catch (e) {}
        });
      }
    }
  }

  disconnect() {
    this.intentionalDisconnect = true;
    this.autoReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.bot && this.bot.viewer) {
      try {
        this.bot.viewer.close();
      } catch (e) {}
    }

    this.cleanup();
    if (this.bot) {
      try {
        if (this.bot._client) {
          this.bot._client.end();
          this.bot._client.destroy();
        }
      } catch (e) {}
      try {
        this.bot.quit();
      } catch (e) {}
    }
  }

  leftClick() {
    if (this.bot && this.status === "online") {
      try {
        const entity = this.bot.entityAtCursor(5);
        if (entity) {
          this.bot.attack(entity);
        } else {
          const block = this.bot.blockAtCursor(5);
          if (block && block.name !== "air") {
            this.bot.dig(block).catch(() => {});
          } else {
            this.bot.swingArm("right");
          }
        }
      } catch (e) {}
    }
  }

  rightClick() {
    if (this.bot && this.status === "online") {
      try {
        const entity = this.bot.entityAtCursor(5);
        const block = this.bot.blockAtCursor(5);

        if (entity) {
          this.bot.activateEntity(entity).catch(() => {});
        } else if (block && block.name !== "air") {
          
          
          this.bot.activateBlock(block).catch(() => {
            
            this.bot.activateItem();
          });
        } else {
          this.bot.activateItem();
        }
      } catch (e) {
        try {
          this.bot.activateItem();
        } catch (err) {}
      }
    }
  }

  dropItem() {
    if (this.bot && this.status === "online") {
      const item = this.bot.inventory.slots[this.bot.quickBarSlot + 36];
      if (item) {
        this.bot.toss(item.type, item.metadata, 1).catch(() => {});
      }
    }
  }

  setHotbarSlot(slot) {
    if (this.bot && this.status === "online") {
      if (slot >= 0 && slot <= 8) {
        this.bot.setQuickBarSlot(slot);
        this.io.emit("hotbar_update", { id: this.id, slot: slot });
        this.emitInventory(); 
      }
    }
  }

  async inventoryClick(slot, mouseButton, mode) {
    if (this.bot && this.status === "online") {
      const window = this.bot.currentWindow || this.bot.inventory;
      try {
        
        
        
        await this.bot.clickWindow(slot, mouseButton, mode);
      } catch (err) {
        this.log(`Envanter tıklama hatası: ${err.message}`);
      }
      this.emitInventory();
    }
  }

  closeWindow() {
    if (this.bot && this.status === "online") {
      const window = this.bot.currentWindow;
      if (window) {
        this.bot.closeWindow(window);
      }
    }
  }

  emitInventory() {
    if (this.bot && this.status === "online") {
      const window = this.bot.currentWindow || this.bot.inventory;
      if (!window) return;

      const items = window.slots.map((item) =>
        item
          ? {
              type: item.type,
              count: item.count,
              metadata: item.metadata,
              name: item.name,
              displayName: item.displayName,
              slot: item.slot,
            }
          : null,
      );

      this.io.emit("inventory_full_update", {
        id: this.id,
        items: items,
        quickBarSlot: this.bot.quickBarSlot,
      });
    }
  }

  

  addAutoTask(taskId, cmd, delayStr) {
    if (!this.bot || this.status !== "online") return;
    const delay = parseInt(delayStr) * 1000;
    if (isNaN(delay) || delay < 1000) return;

    this.removeAutoTask(taskId); 

    const timer = setInterval(() => {
      if (this.status === "online") {
        this.say(cmd);
      }
    }, delay);

    this.autoTasks[taskId] = { timer, cmd, delay };
    this.log(`Oto-Komut eklendi: "${cmd}" her ${delay / 1000} saniyede bir.`);
  }

  removeAutoTask(taskId) {
    if (this.autoTasks[taskId]) {
      clearInterval(this.autoTasks[taskId].timer);
      this.log(`Oto-Komut silindi: "${this.autoTasks[taskId].cmd}"`);
      delete this.autoTasks[taskId];
    }
  }

  stopAllAutoTasks() {
    for (const id in this.autoTasks) {
      clearInterval(this.autoTasks[id].timer);
    }
    this.autoTasks = {};
  }

  toggleAutoClicker(button, delay) {
    if (button === "left") {
      if (this.autoClickerLeft) this.stopAutoClicker("left");
      else this.startAutoClicker("left", delay || 1000);
    } else {
      if (this.autoClickerRight) this.stopAutoClicker("right");
      else this.startAutoClicker("right", delay || 1000);
    }
  }

  startAutoClicker(button, delay) {
    if (!this.bot || this.status !== "online") return;
    if (button === "left") {
      this.autoClickerLeft = setInterval(() => this.leftClick(), delay);
      this.log(`Oto Sol-Tık başlatıldı (${delay}ms)`);
    } else {
      this.autoClickerRight = setInterval(() => this.rightClick(), delay);
      this.log(`Oto Sağ-Tık başlatıldı (${delay}ms)`);
    }
  }

  stopAutoClicker(button) {
    if (button === "left" && this.autoClickerLeft) {
      clearInterval(this.autoClickerLeft);
      this.autoClickerLeft = null;
      this.log("Oto Sol-Tık durduruldu.");
    } else if (button === "right" && this.autoClickerRight) {
      clearInterval(this.autoClickerRight);
      this.autoClickerRight = null;
      this.log("Oto Sağ-Tık durduruldu.");
    }
  }

  toggleAutoAttack(customDelay) {
    if (this.autoAttackTimer) this.stopAutoAttack();
    else this.startAutoAttack(customDelay);
  }

  getAttackDelay() {
    
    if (!this.bot || !this.bot.inventory) return 1000;
    const heldItem = this.bot.inventory.slots[this.bot.quickBarSlot + 36];
    if (!heldItem) return 250; 

    const name = heldItem.name;
    if (name.includes("sword")) return 625; 
    if (name.includes("wooden_axe") || name.includes("stone_axe")) return 1250; 
    if (name.includes("iron_axe")) return 1111; 
    if (name.includes("diamond_axe") || name.includes("netherite_axe"))
      return 1000; 
    if (name.includes("golden_axe")) return 1000;
    if (name.includes("trident")) return 900; 

    return 250; 
  }

  startAutoAttack(customDelay) {
    if (!this.bot || this.status !== "online") return;
    if (this.autoAttackTimer) return;

    const delayStr = customDelay
      ? `Özel Gecikme: ${customDelay}ms`
      : "Otomatik (Silaha Göre)";
    this.log(`Oto-Saldırı (Auto-Attack) aktif edildi. Mod: ${delayStr}`);

    let lastAttackTime = 0;

    this.autoAttackTimer = setInterval(() => {
      if (this.status !== "online") return;
      const now = Date.now();

      
      const baseDelay = customDelay
        ? parseInt(customDelay)
        : this.getAttackDelay();

      
      const finalDelay = baseDelay + Math.floor(Math.random() * 70) + 10;

      if (now - lastAttackTime >= finalDelay) {
        lastAttackTime = now; 

        const target = this.bot.nearestEntity(
          (e) =>
            (e.type === "mob" || e.type === "player") &&
            e.username !== this.bot.username,
        );
        if (
          target &&
          this.bot.entity.position.distanceTo(target.position) <= 4.5
        ) {
          
          const targetWidth = target.width || 0.6;
          const targetHeight = target.height || 1.8;
          const offsetX = (Math.random() - 0.5) * targetWidth;
          const offsetY = Math.random() * targetHeight; 
          const offsetZ = (Math.random() - 0.5) * targetWidth;

          const aimPoint = target.position.offset(offsetX, offsetY, offsetZ);

          
          try {
            this.bot.lookAt(aimPoint, false).catch(() => {});
          } catch (e) {}

          
          setTimeout(() => {
            if (
              this.bot &&
              this.bot.entity &&
              target.position &&
              this.bot.entity.position.distanceTo(target.position) <= 4.5
            ) {
              this.bot.attack(target);
            }
          }, 50);
        }
      }
    }, 50); 
  }

  stopAutoAttack() {
    if (this.autoAttackTimer) {
      clearInterval(this.autoAttackTimer);
      this.autoAttackTimer = null;
      this.log("Oto-Saldırı (Auto-Attack) durduruldu.");
    }
  }

  
  findItems(itemName) {
    if (!this.bot || !this.bot.inventory) return [];
    return this.bot.inventory.items().filter((item) => item.name === itemName);
  }

  loadConfig() {
    const configPath = path.join(__dirname, "bot_configs.json");
    this.blockedPlayers = [];
    this.spammerMessage = "Selam!";
    this.spammerInterval = 10;
    this.spammerActive = false;
    this.spammerMessaged = new Set();
    this.spammerTimer = null;

    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(raw);
        if (config.bots && config.bots[this.username]) {
          const botCfg = config.bots[this.username];
          this.blockedPlayers = botCfg.blockedPlayers || [];
          this.spammerMessage = botCfg.spammerMessage || "Selam!";
          this.spammerInterval = botCfg.spammerInterval || 10;
          if (!this.proxy && botCfg.proxy) {
            this.proxy = botCfg.proxy;
          }
          if (botCfg.brand) {
            this.brand = botCfg.brand;
          }
        }
      } catch (e) {
        this.log("Ayarlar yuklenirken hata olustu: " + e.message);
      }
    }
  }

  saveConfig() {
    const configPath = path.join(__dirname, "bot_configs.json");
    let config = { bots: {} };
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, "utf8");
        config = JSON.parse(raw);
      } catch (e) {}
    }
    if (!config.bots) {
      config.bots = {};
    }
    config.bots[this.username] = {
      blockedPlayers: this.blockedPlayers,
      spammerMessage: this.spammerMessage,
      spammerInterval: this.spammerInterval,
      proxy: this.proxy,
      brand: this.brand,
    };
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    } catch (e) {
      this.log("Ayarlar kaydedilirken hata olustu: " + e.message);
    }
  }

  blockPlayer(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!this.blockedPlayers.includes(trimmed)) {
      this.blockedPlayers.push(trimmed);
      this.saveConfig();
      this.log(`${trimmed} engellendi.`);
      this.emitUpdate();
    } else {
      this.log(`${trimmed} zaten engelli.`);
    }
  }

  unblockPlayer(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const index = this.blockedPlayers.indexOf(trimmed);
    if (index !== -1) {
      this.blockedPlayers.splice(index, 1);
      this.saveConfig();
      this.log(`${trimmed} engeli kaldirildi.`);
      this.emitUpdate();
    } else {
      this.log(`${trimmed} engelli degil.`);
    }
  }

  startSpammer(message, interval) {
    if (!this.bot || this.status !== "online") return;
    this.stopSpammer();

    this.spammerMessage = message || "Selam!";
    this.spammerInterval = parseInt(interval, 10) || 10;
    this.spammerActive = true;
    this.spammerMessaged.clear();
    this.saveConfig();

    this.log(`Spammer baslatildi. Mesaj: "${this.spammerMessage}" Gecikme: ${this.spammerInterval}s`);
    this.emitUpdate();

    const runSpammerTick = () => {
      if (!this.bot || this.status !== "online" || !this.spammerActive) {
        this.stopSpammer();
        return;
      }

      const players = Object.keys(this.bot.players);
      const target = players.find((name) => {
        return (
          name !== this.bot.username &&
          !this.blockedPlayers.includes(name) &&
          !this.spammerMessaged.has(name)
        );
      });

      if (target) {
        this.bot.chat(`/msg ${target} ${this.spammerMessage}`);
        this.spammerMessaged.add(target);
        this.log(`Oto-Fisil: ${target} -> "${this.spammerMessage}"`);
      }

      this.spammerTimer = setTimeout(runSpammerTick, this.spammerInterval * 1000);
    };

    this.spammerTimer = setTimeout(runSpammerTick, this.spammerInterval * 1000);
  }

  stopSpammer() {
    this.spammerActive = false;
    if (this.spammerTimer) {
      clearTimeout(this.spammerTimer);
      this.spammerTimer = null;
    }
    this.log("Spammer durduruldu.");
    this.emitUpdate();
  }

  emitPlayers() {
    if (this.bot && this.bot.players) {
      this.io.emit("bot_players", {
        id: this.id,
        players: Object.keys(this.bot.players),
      });
    }
  }
}

module.exports = Bot;
