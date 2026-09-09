import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  Zap,
  Users,
  Terminal,
  Play,
  Square,
  MessageSquare,
  LogOut,
  Send,
  UserPlus,
  Box,
  Settings,
  Crosshair,
  RefreshCw,
  Radio,
  Wifi,
  WifiOff,
  ChevronRight,
  Sparkles,
  Activity,
  Hash,
  Globe,
  MousePointer2,
} from "lucide-react";
import MinecraftViewer from "./MinecraftViewer";
import GameControls from "./Joystick";
import MouseKeyboardControls from "./MouseKeyboardControls";
import InventoryUI from "./InventoryUI";

const socket = io(`http://${window.location.hostname}:3001`);

function App() {
  const [bots, setBots] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [globalLogs, setGlobalLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [botPlayers, setBotPlayers] = useState({});

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("bots_list", (data) => {
      setBots(data);
    });

    socket.on("bot_updated", (updatedBot) => {
      setBots((prev) =>
        prev.map((b) => (b.id === updatedBot.id ? updatedBot : b))
      );
    });

    socket.on("bot_log", (log) => {
      setGlobalLogs((prev) => [...prev.slice(-499), log]);
    });

    socket.on("bot_chat", (chat) => {
      const msg = `[${new Date().toLocaleTimeString()}] [CHAT] ${chat.username}: ${chat.message}`;
      setGlobalLogs((prev) => [
        ...prev.slice(-499),
        { id: chat.id, message: msg },
      ]);
    });

    socket.on("bot_players", (data) => {
      setBotPlayers((prev) => ({
        ...prev,
        [data.id]: data.players || [],
      }));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("bots_list");
      socket.off("bot_updated");
      socket.off("bot_log");
      socket.off("bot_chat");
      socket.off("bot_players");
    };
  }, []);

  const onlineCount = bots.filter((b) => b.status === "online").length;
  const connectingCount = bots.filter((b) => b.status === "connecting").length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-dark-bg)" }}>
      <div
        className="w-72 flex flex-col flex-shrink-0 relative"
        style={{
          background: "linear-gradient(180deg, #0a0a1a 0%, #06060f 100%)",
          borderRight: "1px solid rgba(139, 92, 246, 0.12)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top left, rgba(139, 92, 246, 0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative p-5 flex flex-col gap-1" style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.1)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center aura-glow"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
            >
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none aura-text">
                MessageAura
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Bot Control Panel
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg"
            style={{
              background: connected
                ? "rgba(16, 185, 129, 0.08)"
                : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${connected ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${connected ? "status-dot-online" : ""}`}
              style={{ background: connected ? "#10b981" : "#ef4444" }}
            />
            <span className="text-xs font-medium" style={{ color: connected ? "#10b981" : "#ef4444" }}>
              {connected ? "Bağlandı" : "Bağlantı Kesildi"}
            </span>
            <div className="ml-auto flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              <Activity size={11} />
              <span className="text-xs">{onlineCount} aktif</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 relative">
          <NavItem
            icon={<Radio size={16} />}
            label="Kontrol Paneli"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <NavItem
            icon={<Terminal size={16} />}
            label="Genel Konsol"
            active={activeTab === "global"}
            onClick={() => setActiveTab("global")}
            badge={globalLogs.length > 0 ? globalLogs.length : null}
          />

          <div className="pt-4 pb-1 px-2">
            <p
              className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
              style={{ color: "rgba(139, 92, 246, 0.6)" }}
            >
              <Hash size={10} />
              Aktif İstemciler
            </p>
          </div>

          {bots.length === 0 && (
            <div
              className="text-center py-6 px-3 rounded-xl"
              style={{ color: "var(--color-text-muted)", background: "rgba(139, 92, 246, 0.04)", border: "1px dashed rgba(139, 92, 246, 0.1)" }}
            >
              <Users size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Henüz bot yok</p>
            </div>
          )}

          {bots.map((bot) => (
            <BotNavItem
              key={bot.id}
              bot={bot}
              active={activeTab === `bot_${bot.id}`}
              onClick={() => setActiveTab(`bot_${bot.id}`)}
            />
          ))}
        </div>

        <div
          className="p-4 relative"
          style={{ borderTop: "1px solid rgba(139, 92, 246, 0.08)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              v2.0 — MessageAura
            </span>
            <div className="flex gap-1.5">
              {[
                { count: onlineCount, color: "#10b981", label: "online" },
                { count: connectingCount, color: "#f59e0b", label: "connecting" },
              ].map(({ count, color, label }) => (
                count > 0 && (
                  <div
                    key={label}
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
                  >
                    {count}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ background: "var(--color-dark-bg)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 70% 10%, rgba(99, 102, 241, 0.05) 0%, transparent 60%)",
          }}
        />
        <div className="h-full overflow-y-auto relative">
          <div className="p-6 min-h-full">
            {activeTab === "dashboard" && <Dashboard bots={bots} />}
            {activeTab === "global" && <GeneralConsole bots={bots} logs={globalLogs} />}
            {activeTab.startsWith("bot_") && (
              <BotDetail
                bot={bots.find((b) => b.id === activeTab.replace("bot_", ""))}
                logs={globalLogs.filter((l) => l.id === activeTab.replace("bot_", ""))}
                players={botPlayers[activeTab.replace("bot_", "")] || []}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all nav-item ${active ? "active" : ""}`}
      style={{
        color: active ? "#c4b5fd" : "var(--color-text-muted)",
        border: active ? undefined : "1px solid transparent",
      }}
    >
      <span className={active ? "text-violet-400" : ""}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-md font-bold"
          style={{ background: "rgba(139, 92, 246, 0.2)", color: "#a78bfa" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {active && <ChevronRight size={14} className="text-violet-400 opacity-60" />}
    </button>
  );
}

function BotNavItem({ bot, active, onClick }) {
  const statusConfig = {
    online: { color: "#10b981", glow: "rgba(16,185,129,0.4)", icon: <Wifi size={11} /> },
    connecting: { color: "#f59e0b", glow: "rgba(245,158,11,0.4)", icon: <Activity size={11} /> },
    disconnected: { color: "#ef4444", glow: null, icon: <WifiOff size={11} /> },
    error: { color: "#ef4444", glow: null, icon: <WifiOff size={11} /> },
  };
  const cfg = statusConfig[bot.status] || statusConfig.error;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-all nav-item ${active ? "active" : ""}`}
      style={{
        color: active ? "#e2e0ff" : "var(--color-text-muted)",
        border: active ? undefined : "1px solid transparent",
      }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: active ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.06)",
          border: "1px solid rgba(139, 92, 246, 0.15)",
        }}
      >
        <Users size={11} style={{ color: "#a78bfa" }} />
      </div>
      <span className="truncate flex-1 text-left text-xs font-medium">{bot.username}</span>
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md flex-shrink-0"
        style={{
          background: `${cfg.color}15`,
          color: cfg.color,
          border: `1px solid ${cfg.color}25`,
          boxShadow: cfg.glow && bot.status === "online" ? `0 0 8px ${cfg.glow}` : "none",
        }}
      >
        {cfg.icon}
      </div>
    </button>
  );
}

function StatCard({ label, value, icon, color, glowColor }) {
  return (
    <div
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      style={{ border: `1px solid ${color}18` }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}0a 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        }}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
            {label}
          </p>
          <p className="text-4xl font-black" style={{ color }}>
            {value}
          </p>
        </div>
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}25`,
            color,
            boxShadow: `0 0 20px ${color}20`,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ bots }) {
  const [addMode, setAddMode] = useState("single");
  const [newBot, setNewBot] = useState({
    username: "",
    host: "localhost",
    version: false,
    macrosStr: "",
    proxy: "",
    brand: "vanilla",
  });
  const [multiConfig, setMultiConfig] = useState({
    prefix: "AFK_BOT",
    count: 5,
    host: "localhost",
    version: false,
    macrosStr: "",
    proxiesStr: "",
    brand: "vanilla",
  });

  const commonVersions = [
    { value: false, label: "Otomatik Algıla (Önerilen)" },
    { value: "1.21.1", label: "1.21.1" },
    { value: "1.20.4", label: "1.20.4" },
    { value: "1.20.1", label: "1.20.1" },
    { value: "1.19.4", label: "1.19.4" },
    { value: "1.16.5", label: "1.16.5" },
    { value: "26.1.2", label: "26.1.2 (Özel)" },
    { value: "26.1.1", label: "26.1.1 (Özel)" },
  ];

  const commonBrands = [
    { value: "vanilla", label: "Vanilla (Önerilen)" },
    { value: "lunarclient", label: "Lunar Client" },
    { value: "fabric", label: "Fabric Client" },
    { value: "forge", label: "Forge Client" },
    { value: "badlion", label: "Badlion Client" },
    { value: "labymod", label: "LabyMod" },
    { value: "mineflayer", label: "Mineflayer Default" },
  ];

  const handleCreateSingle = (e) => {
    e.preventDefault();
    if (newBot.username && newBot.host) {
      const macros = newBot.macrosStr
        ? newBot.macrosStr.split(",").map((s) => s.trim()).filter((s) => s)
        : [];
      socket.emit("create_bot", {
        ...newBot,
        macros,
        proxy: newBot.proxy || null,
      });
      setNewBot((prev) => ({ ...prev, username: "", proxy: "" }));
    }
  };

  const handleCreateMulti = (e) => {
    e.preventDefault();
    if (multiConfig.prefix && multiConfig.host && multiConfig.count > 0) {
      const macros = multiConfig.macrosStr
        ? multiConfig.macrosStr.split(",").map((s) => s.trim()).filter((s) => s)
        : [];
      const proxies = multiConfig.proxiesStr
        ? multiConfig.proxiesStr.split("\n").map((s) => s.trim()).filter((s) => s)
        : [];
      for (let i = 1; i <= multiConfig.count; i++) {
        const proxy = proxies.length > 0 ? proxies[(i - 1) % proxies.length] : null;
        socket.emit("create_bot", {
          username: `${multiConfig.prefix}${i}`,
          host: multiConfig.host,
          version: multiConfig.version,
          macros,
          proxy,
          brand: multiConfig.brand,
        });
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Kontrol Paneli
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Bot ağını yönet, yeni bağlantılar oluştur
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          style={{ background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.2)", color: "#a78bfa" }}
        >
          <Sparkles size={12} />
          MessageAura v2.0
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Çevrimiçi"
          value={bots.filter((b) => b.status === "online").length}
          icon={<Wifi size={20} />}
          color="#10b981"
          glowColor="rgba(16, 185, 129, 0.3)"
        />
        <StatCard
          label="Bağlanıyor"
          value={bots.filter((b) => b.status === "connecting").length}
          icon={<Activity size={20} />}
          color="#f59e0b"
          glowColor="rgba(245, 158, 11, 0.3)"
        />
        <StatCard
          label="Çevrimdışı"
          value={bots.filter((b) => b.status === "disconnected" || b.status === "error").length}
          icon={<WifiOff size={20} />}
          color="#f43f5e"
          glowColor="rgba(244, 63, 94, 0.3)"
        />
      </div>

      <div
        className="glass-card rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(139, 92, 246, 0.15)" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.2)" }}
            >
              <UserPlus size={16} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Yeni İstemci</h3>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Minecraft sunucusuna bot bağla</p>
            </div>
          </div>

          <div
            className="flex p-1 rounded-xl gap-1"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.1)" }}
          >
            {["single", "multi"].map((mode) => (
              <button
                key={mode}
                onClick={() => setAddMode(mode)}
                className="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: addMode === mode
                    ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                    : "transparent",
                  color: addMode === mode ? "white" : "var(--color-text-muted)",
                  boxShadow: addMode === mode ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none",
                }}
              >
                {mode === "single" ? "Tekli" : "Çoklu"}
              </button>
            ))}
          </div>
        </div>

        {addMode === "single" ? (
          <form onSubmit={handleCreateSingle} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormField label="Kullanıcı Adı" icon={<Users size={13} />}>
                <AuraInput
                  value={newBot.username}
                  onChange={(e) => setNewBot({ ...newBot, username: e.target.value })}
                  placeholder="Örn: AFK_Bot_1"
                  required
                />
              </FormField>
              <FormField label="Sunucu IP" icon={<Globe size={13} />}>
                <AuraInput
                  value={newBot.host}
                  onChange={(e) => setNewBot({ ...newBot, host: e.target.value })}
                  placeholder="mc.sunucu.com veya IP:Port"
                  required
                />
              </FormField>
              <FormField label="Sürüm" icon={<Hash size={13} />}>
                <AuraSelect
                  value={newBot.version === false ? "false" : newBot.version}
                  onChange={(e) => setNewBot({ ...newBot, version: e.target.value === "false" ? false : e.target.value })}
                  options={commonVersions}
                />
              </FormField>
              <FormField label="Proxy (Opsiyonel)" icon={<Globe size={13} />}>
                <AuraInput
                  value={newBot.proxy}
                  onChange={(e) => setNewBot({ ...newBot, proxy: e.target.value })}
                  placeholder="Örn: 127.0.0.1:1080 veya socks5://..."
                />
              </FormField>
              <FormField label="İstemci Kimliği" icon={<Settings size={13} />}>
                <AuraSelect
                  value={newBot.brand}
                  onChange={(e) => setNewBot({ ...newBot, brand: e.target.value })}
                  options={commonBrands}
                />
              </FormField>
              <FormField label="Makrolar (virgülle ayır)" icon={<Terminal size={13} />} className="md:col-span-2 lg:col-span-3">
                <AuraInput
                  value={newBot.macrosStr}
                  onChange={(e) => setNewBot({ ...newBot, macrosStr: e.target.value })}
                  placeholder="Örn: /register 123 123, /survival"
                />
              </FormField>
            </div>
            <div className="flex justify-end mt-5 pt-4" style={{ borderTop: "1px solid rgba(139, 92, 246, 0.08)" }}>
              <button
                type="submit"
                className="aura-btn px-8 py-3 rounded-xl flex items-center gap-2 text-sm"
              >
                <Play size={15} fill="currentColor" />
                İstemciyi Başlat
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateMulti} className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <FormField label="Ad Öneki" icon={<Users size={13} />}>
                <AuraInput
                  value={multiConfig.prefix}
                  onChange={(e) => setMultiConfig({ ...multiConfig, prefix: e.target.value })}
                  placeholder="AFK_BOT"
                  required
                />
              </FormField>
              <FormField label="Adet" icon={<Hash size={13} />}>
                <AuraInput
                  type="number"
                  min="1"
                  max="100"
                  value={multiConfig.count}
                  onChange={(e) => setMultiConfig({ ...multiConfig, count: parseInt(e.target.value) || 1 })}
                  required
                />
              </FormField>
              <FormField label="Sunucu IP" icon={<Globe size={13} />}>
                <AuraInput
                  value={multiConfig.host}
                  onChange={(e) => setMultiConfig({ ...multiConfig, host: e.target.value })}
                  placeholder="mc.sunucu.com"
                  required
                />
              </FormField>
              <FormField label="Sürüm" icon={<Hash size={13} />}>
                <AuraSelect
                  value={multiConfig.version === false ? "false" : multiConfig.version}
                  onChange={(e) => setMultiConfig({ ...multiConfig, version: e.target.value === "false" ? false : e.target.value })}
                  options={commonVersions}
                />
              </FormField>
              <FormField label="Makrolar" icon={<Terminal size={13} />} className="col-span-2 md:col-span-4">
                <AuraInput
                  value={multiConfig.macrosStr}
                  onChange={(e) => setMultiConfig({ ...multiConfig, macrosStr: e.target.value })}
                  placeholder="Örn: /register 123 123, /survival"
                />
              </FormField>
              <FormField label="İstemci Kimliği" icon={<Settings size={13} />} className="col-span-2 md:col-span-4">
                <AuraSelect
                  value={multiConfig.brand}
                  onChange={(e) => setMultiConfig({ ...multiConfig, brand: e.target.value })}
                  options={commonBrands}
                />
              </FormField>
              <FormField
                label="Proxy Listesi (Her satıra bir adet - Opsiyonel)"
                icon={<Globe size={13} />}
                className="col-span-2 md:col-span-4"
              >
                <div className="flex flex-col gap-2">
                  <textarea
                    value={multiConfig.proxiesStr}
                    onChange={(e) => setMultiConfig({ ...multiConfig, proxiesStr: e.target.value })}
                    placeholder="Örn:&#10;127.0.0.1:1080&#10;socks5://127.0.0.1:1081"
                    rows="5"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white"
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(139, 92, 246, 0.15)",
                      fontFamily: "JetBrains Mono, monospace",
                      resize: "vertical",
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch("https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text");
                        if (res.ok) {
                          const text = await res.text();
                          const socks5Only = text
                            .split("\n")
                            .map((line) => line.trim())
                            .filter((line) => line.startsWith("socks5://"))
                            .join("\n");
                          setMultiConfig((prev) => ({
                            ...prev,
                            proxiesStr: socks5Only,
                          }));
                        }
                      } catch (err) {
                        alert("Proxy listesi alinirken hata olustu.");
                      }
                    }}
                    className="self-start px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-300 hover:text-white transition-all bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/25"
                  >
                    ProxyScape API'den Otomatik Çek
                  </button>
                </div>
              </FormField>
            </div>
            <div className="flex justify-between items-center mt-5 pt-4" style={{ borderTop: "1px solid rgba(139, 92, 246, 0.08)" }}>
              <div
                className="text-xs px-3 py-2 rounded-lg"
                style={{ background: "rgba(139, 92, 246, 0.08)", color: "#a78bfa", border: "1px solid rgba(139, 92, 246, 0.15)" }}
              >
                <span className="font-bold">Önizleme:</span>{" "}
                {multiConfig.prefix}1 ... {multiConfig.prefix}{multiConfig.count}
              </div>
              <button
                type="submit"
                className="aura-btn px-8 py-3 rounded-xl flex items-center gap-2 text-sm"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                <Play size={15} fill="currentColor" />
                {multiConfig.count} İstemci Başlat
              </button>
            </div>
          </form>
        )}
      </div>

      {bots.length > 0 && (
        <div
          className="glass-card rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(139, 92, 246, 0.12)" }}
        >
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.08)" }}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={15} className="text-violet-400" />
              Aktif İstemciler
            </h3>
            <button
              onClick={() => {
                if (window.confirm("Tum istemcileri silmek istediginize emin misiniz?")) {
                  socket.emit("remove_all_bots");
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white transition-all bg-rose-600/10 hover:bg-rose-600/30 border border-rose-500/20"
            >
              Tümünü Sil
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(139, 92, 246, 0.06)" }}>
            {bots.map((bot) => (
              <BotListRow key={bot.id} bot={bot} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BotListRow({ bot }) {
  const statusConfig = {
    online: { color: "#10b981", label: "Çevrimiçi", glow: true },
    connecting: { color: "#f59e0b", label: "Bağlanıyor" },
    disconnected: { color: "#f43f5e", label: "Çevrimdışı" },
    error: { color: "#f43f5e", label: "Hata" },
  };
  const cfg = statusConfig[bot.status] || statusConfig.error;

  return (
    <div className="px-6 py-3 flex items-center gap-4 hover:bg-violet-500/[0.03] transition-colors">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: cfg.color,
          boxShadow: cfg.glow ? `0 0 8px ${cfg.color}` : "none",
        }}
      />
      <span className="text-sm font-medium text-white">{bot.username}</span>
      <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
        {bot.host}{bot.port ? `:${bot.port}` : ""} {bot.proxy && `| Proxy: ${bot.proxy}`}
      </span>
      <div className="ml-auto">
        <span
          className="text-xs px-2 py-0.5 rounded-md font-semibold"
          style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

function GeneralConsole({ bots, logs }) {
  const [message, setMessage] = useState("");
  const logsContainerRef = useRef(null);
  const onlineBotsCount = bots.filter((b) => b.status === "online").length;

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const sendGlobalCommand = (action, data = null) => {
    if (action === "remove_all_bots") {
      if (window.confirm("Tum istemcileri silmek istediginize emin misiniz?")) {
        socket.emit("remove_all_bots");
      }
    } else {
      socket.emit("global_action", { action, data });
    }
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendGlobalCommand("say", message);
      setMessage("");
    }
  };

  const actions = [
    { label: "Toplu AFK Başlat", action: "start_random", color: "#10b981", icon: <Play size={15} /> },
    { label: "Toplu AFK Durdur", action: "stop_random", color: "#f59e0b", icon: <Square size={15} /> },
    { label: "Tümünü Kapat", action: "disconnect", color: "#f43f5e", icon: <LogOut size={15} /> },
    { label: "Tümünü Sil", action: "remove_all_bots", color: "#ef4444", icon: <LogOut size={15} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5 h-full" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Genel Konsol</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Tüm botları tek komutla yönet
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map(({ label, action, color, icon }) => (
          <button
            key={action}
            onClick={() => sendGlobalCommand(action)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: `${color}10`,
              border: `1px solid ${color}20`,
              color,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${color}20`;
              e.currentTarget.style.borderColor = `${color}40`;
              e.currentTarget.style.boxShadow = `0 0 20px ${color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${color}10`;
              e.currentTarget.style.borderColor = `${color}20`;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5" style={{ border: "1px solid rgba(139, 92, 246, 0.1)" }}>
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Radio size={16} className="text-violet-400" />
            Toplu Oyuncu Spammer (Oto-Fısıltı)
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const msg = e.target.elements.globalSpammerMsg.value;
              const interval = parseInt(e.target.elements.globalSpammerInt.value, 10);
              socket.emit("global_action", { action: "start_spammer", data: { message: msg, interval } });
            }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <input
                name="globalSpammerMsg"
                type="text"
                placeholder="Toplu Fısıltı Mesajı"
                className="flex-1 px-3 py-2 rounded-lg text-xs text-white"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
                required
              />
              <input
                name="globalSpammerInt"
                type="number"
                placeholder="Saniye (10)"
                min="1"
                className="w-24 px-3 py-2 rounded-lg text-xs text-white text-center"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)", fontFamily: "JetBrains Mono, monospace" }}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all border border-violet-500/30"
              >
                Tümünde Başlat
              </button>
              <button
                type="button"
                onClick={() => socket.emit("global_action", { action: "stop_spammer" })}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all border border-rose-500/30"
              >
                Tümünde Durdur
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card rounded-xl p-5" style={{ border: "1px solid rgba(139, 92, 246, 0.1)" }}>
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-emerald-400" />
            Toplu Oyuncu Engelleme
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.elements.globalBlockName.value.trim();
              if (name) {
                socket.emit("global_action", { action: "block_player", data: name });
                e.target.reset();
              }
            }}
            className="space-y-3"
          >
            <input
              name="globalBlockName"
              type="text"
              placeholder="Engellenecek oyuncu adı"
              className="w-full px-3 py-2 rounded-lg text-xs text-white"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600/35 hover:bg-rose-600/50 transition-all border border-rose-500/30"
              >
                Tümünde Engelle
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const form = e.currentTarget.form;
                  const name = form.globalBlockName.value.trim();
                  if (name) {
                    socket.emit("global_action", { action: "unblock_player", data: name });
                    form.reset();
                  }
                }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600/35 hover:bg-emerald-600/50 transition-all border border-emerald-500/30"
              >
                Tümünde Kaldır
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card rounded-xl p-5" style={{ border: "1px solid rgba(139, 92, 246, 0.1)" }}>
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <RefreshCw size={16} className="text-blue-400" />
            Toplu Yeniden Bağlan (IP/Port)
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const host = e.target.elements.globalReconnectHost.value.trim();
              if (host) {
                sendGlobalCommand("reconnect", host);
              }
            }}
            className="space-y-3"
          >
            <input
              name="globalReconnectHost"
              type="text"
              placeholder="Örn: mc.sunucu.com:25565"
              className="w-full px-3 py-2 rounded-lg text-xs text-white"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)", fontFamily: "JetBrains Mono, monospace" }}
              required
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-blue-600/35 hover:bg-blue-600/50 transition-all border border-blue-500/30"
            >
              Tümünü Yeniden Bağla
            </button>
          </form>
        </div>
      </div>

      <div
        className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden"
        style={{ border: "1px solid rgba(139, 92, 246, 0.15)", minHeight: "400px" }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.08)" }}
        >
          <div className="flex gap-1.5">
            {["#f43f5e", "#f59e0b", "#10b981"].map((c) => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.6 }} />
            ))}
          </div>
          <span className="text-xs font-medium ml-2" style={{ color: "var(--color-text-muted)" }}>
            <Terminal size={12} className="inline mr-1" />
            global.log — {logs.length} kayıt
          </span>
        </div>

        <div ref={logsContainerRef} className="overflow-y-auto p-4 space-y-0.5" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", height: "500px" }}>
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3" style={{ color: "var(--color-text-muted)" }}>
              <Terminal size={32} className="opacity-20" />
              <p className="text-sm">Henüz log yok...</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <ConsoleLog key={i} log={log} bots={bots} showBot />
            ))
          )}
        </div>

        <form
          onSubmit={handleChat}
          className="flex gap-2 p-3"
          style={{ borderTop: "1px solid rgba(139, 92, 246, 0.08)" }}
        >
          <div className="flex-1 relative">
            <MessageSquare
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(139, 92, 246, 0.15)",
                color: "white",
                fontFamily: "JetBrains Mono, monospace",
              }}
              placeholder={`${onlineBotsCount} bota mesaj gönder...`}
              disabled={onlineBotsCount === 0}
            />
          </div>
          <button
            type="submit"
            disabled={onlineBotsCount === 0}
            className="aura-btn px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
          >
            <Send size={14} />
            Gönder
          </button>
        </form>
      </div>
    </div>
  );
}

function BotDetail({ bot, logs, players }) {
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("console");
  const [newIp, setNewIp] = useState(bot ? (bot.port ? `${bot.host}:${bot.port}` : bot.host) : "localhost");
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [controlMode, setControlMode] = useState("default");
  const [scoreboard, setScoreboard] = useState(null);
  const [showTabList, setShowTabList] = useState(false);
  const [tabSearch, setTabSearch] = useState("");
  const logsContainerRef = useRef(null);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, viewMode]);

  useEffect(() => {
    if (bot?.id && bot?.status === "online") {
      socket.emit("bot_action", { id: bot.id, action: "request_players" });
    }
  }, [bot?.id, bot?.status]);

  useEffect(() => {
    const handlePos = (data) => {
      if (data.id === bot?.id) {
        setPos({ x: data.x, y: data.y, z: data.z });
      }
    };
    const handleScoreboard = (data) => {
      if (data.id === bot?.id) setScoreboard(data);
    };
    socket.on("bot_position", handlePos);
    socket.on("bot_scoreboard", handleScoreboard);
    return () => {
      socket.off("bot_position", handlePos);
      socket.off("bot_scoreboard", handleScoreboard);
    };
  }, [bot?.id]);

  if (!bot) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: "var(--color-text-muted)" }}>
      <Users size={40} className="opacity-20" />
      <p>İstemci bulunamadı.</p>
    </div>
  );

  const sendAction = (action, data = null) => {
    socket.emit("bot_action", { id: bot.id, action, data });
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendAction("say", message);
      setMessage("");
    }
  };

  const handleDelete = () => {
    if (window.confirm(`"${bot.username}" istemcisini tamamen silmek istiyor musunuz?`)) {
      socket.emit("remove_bot", bot.id);
    }
  };

  const statusConfig = {
    online: { color: "#10b981", label: "Çevrimiçi", glow: true },
    connecting: { color: "#f59e0b", label: "Bağlanıyor" },
    disconnected: { color: "#f43f5e", label: "Çevrimdışı" },
    error: { color: "#f43f5e", label: "Hata" },
  };
  const cfg = statusConfig[bot.status] || statusConfig.error;

  const tabs = [
    { id: "console", label: "Terminal", icon: <Terminal size={14} /> },
    { id: "viewer", label: "3D Görünüm", icon: <Box size={14} /> },
    { id: "automation", label: "Otomasyon", icon: <Settings size={14} /> },
    { id: "playerutils", label: "PlayerUtils", icon: <Users size={14} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div
        className="glass-card rounded-2xl p-5"
        style={{ border: `1px solid ${cfg.color}20` }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{
                background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}10)`,
                border: `1px solid ${cfg.color}30`,
                color: cfg.color,
                boxShadow: cfg.glow ? `0 0 20px ${cfg.color}30` : "none",
              }}
            >
              {bot.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{bot.username}</h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                  style={{
                    background: `${cfg.color}18`,
                    color: cfg.color,
                    border: `1px solid ${cfg.color}30`,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
                  {bot.host}{bot.port ? `:${bot.port}` : ""} {bot.proxy && `| Proxy: ${bot.proxy}`}
                </span>
                {bot.status === "online" && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-mono"
                    style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.2)" }}
                  >
                    {pos.x.toFixed(1)} / {pos.y.toFixed(1)} / {pos.z.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {bot.status === "online" && (
              <>
                <AuraActionBtn
                  onClick={() => sendAction("start_random")}
                  color="#10b981"
                  icon={<Play size={14} fill="currentColor" />}
                  label="AFK Başlat"
                />
                <AuraActionBtn
                  onClick={() => sendAction("stop_random")}
                  color="#f59e0b"
                  icon={<Square size={14} fill="currentColor" />}
                  label="AFK Durdur"
                />
                <AuraActionBtn
                  onClick={() => sendAction("disconnect")}
                  color="#f43f5e"
                  icon={<LogOut size={14} />}
                  label="Kapat"
                />
              </>
            )}
            {(bot.status === "disconnected" || bot.status === "error") && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="text-sm text-white w-36 px-3 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                  placeholder="IP:Port"
                />
                <AuraActionBtn
                  onClick={() => sendAction("reconnect", newIp)}
                  color="#10b981"
                  icon={<RefreshCw size={14} />}
                  label="Yeniden Bağlan"
                />
              </div>
            )}
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              style={{
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.15)",
                color: "#f87171",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(244, 63, 94, 0.15)";
                e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(244, 63, 94, 0.08)";
                e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.15)";
              }}
            >
              <LogOut size={13} />
              Sil
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
              style={{
                background: viewMode === id
                  ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                  : "rgba(139, 92, 246, 0.06)",
                color: viewMode === id ? "white" : "var(--color-text-muted)",
                border: `1px solid ${viewMode === id ? "rgba(139, 92, 246, 0.4)" : "rgba(139, 92, 246, 0.1)"}`,
                boxShadow: viewMode === id ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none",
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {viewMode === "viewer" && (
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.1)" }}
          >
            {["default", "joystick"].map((mode) => (
              <button
                key={mode}
                onClick={() => setControlMode(mode)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: controlMode === mode ? "rgba(139, 92, 246, 0.3)" : "transparent",
                  color: controlMode === mode ? "#c4b5fd" : "var(--color-text-muted)",
                }}
              >
                {mode === "default" ? "Klavye & Mouse" : "Joystick"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col"
        style={{ border: "1px solid rgba(139, 92, 246, 0.12)", minHeight: "450px" }}
      >
        {viewMode === "automation" ? (
          <AutomationPanel bot={bot} sendAction={sendAction} players={players} />
        ) : viewMode === "playerutils" ? (
          <PlayerUtilsPanel key={bot.id} bot={bot} sendAction={sendAction} players={players} />
        ) : viewMode === "console" ? (
          <>
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.08)" }}
            >
              <div className="flex gap-1.5">
                {["#f43f5e", "#f59e0b", "#10b981"].map((c) => (
                  <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.5 }} />
                ))}
              </div>
              <span className="text-xs font-medium ml-2" style={{ color: "var(--color-text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
                {bot.username}.log — {logs.length} kayıt
              </span>
              <button
                type="button"
                onClick={() => setShowTabList((prev) => !prev)}
                className="ml-auto px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                style={{
                  background: showTabList ? "rgba(139, 92, 246, 0.15)" : "transparent",
                  color: showTabList ? "#c4b5fd" : "var(--color-text-muted)",
                  border: "1px solid rgba(139, 92, 246, 0.12)",
                }}
              >
                <Users size={12} />
                TAB Listesi
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0">
                <div ref={logsContainerRef} className="overflow-y-auto p-4 space-y-0.5" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", height: "500px" }}>
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3" style={{ color: "var(--color-text-muted)" }}>
                      <Terminal size={32} className="opacity-20" />
                      <p className="text-sm">Henüz log yok...</p>
                    </div>
                  ) : (
                    logs.map((log, i) => (
                      <ConsoleLog key={i} log={log} />
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleChat}
                  className="flex gap-2 p-3"
                  style={{ borderTop: "1px solid rgba(139, 92, 246, 0.08)" }}
                >
                  <div className="flex-1 relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                      style={{ color: "rgba(139, 92, 246, 0.6)", fontFamily: "JetBrains Mono, monospace" }}
                    >
                      &gt;
                    </span>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(139, 92, 246, 0.15)",
                        color: "white",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                      placeholder="Mesaj veya komut gönder..."
                      disabled={bot.status !== "online"}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={bot.status !== "online"}
                    className="aura-btn px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                    Gönder
                  </button>
                </form>
              </div>

              {showTabList && (
                <div
                  className="w-64 border-l flex flex-col p-4 relative flex-shrink-0"
                  style={{
                    borderColor: "rgba(139, 92, 246, 0.08)",
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  <div className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-400" />
                    Online Oyuncular ({players?.length || 0})
                  </div>
                  <input
                    type="text"
                    value={tabSearch}
                    onChange={(e) => setTabSearch(e.target.value)}
                    placeholder="Ara..."
                    className="w-full px-3 py-2 rounded-lg text-xs text-white mb-3"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
                  />
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {(players || [])
                      .filter((p) => p.toLowerCase().includes(tabSearch.toLowerCase()))
                      .map((name) => {
                        const blocked = bot.blockedPlayers?.includes(name);
                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between p-2 rounded-lg"
                            style={{ background: "rgba(139, 92, 246, 0.04)", border: "1px solid rgba(139, 92, 246, 0.06)" }}
                          >
                            <span className="text-xs font-mono text-white truncate max-w-[100px]" title={name}>
                              {name}
                            </span>
                            <button
                              type="button"
                              onClick={() => sendAction(blocked ? "unblock_player" : "block_player", name)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold transition-all"
                              style={{
                                background: blocked ? "rgba(239, 68, 68, 0.15)" : "rgba(139, 92, 246, 0.15)",
                                color: blocked ? "#f87171" : "#c4b5fd",
                                border: blocked ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(139, 92, 246, 0.25)",
                              }}
                            >
                              {blocked ? "Kaldır" : "Engelle"}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col relative overflow-hidden bg-black rounded-2xl">
            {bot.status === "online" ? (
              <>
                <MinecraftViewer socket={socket} botId={bot.id} bot={bot} />
                {controlMode === "joystick" ? (
                  <GameControls socket={socket} botId={bot.id} />
                ) : (
                  <MouseKeyboardControls socket={socket} botId={bot.id} />
                )}
                <InventoryUI socket={socket} botId={bot.id} controlMode={controlMode} />
                <div className="absolute top-3 right-3 z-20 flex gap-2">
                  <button
                    className="text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(139, 92, 246, 0.2)",
                    }}
                    onClick={() => sendAction("say", "/survival")}
                  >
                    <Play size={12} className="text-emerald-400" />
                    /survival
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: "var(--color-text-muted)" }}>
                <div
                  className="p-6 rounded-2xl"
                  style={{ background: "rgba(139, 92, 246, 0.06)", border: "1px dashed rgba(139, 92, 246, 0.15)" }}
                >
                  <Box size={40} className="opacity-30 mx-auto" />
                </div>
                <p className="text-sm">Bot bağlandığında 3D ekran aktif olacak</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AutomationPanel({ bot, sendAction, players }) {
  return (
    <div className="p-6 overflow-y-auto flex-1 space-y-6">
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <Settings size={18} className="text-violet-400" />
        Otomasyon Sistemi
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(139, 92, 246, 0.1)" }}
        >
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Crosshair size={16} className="text-rose-400" />
            Saldırı & Tıklama
          </h4>
          <div className="space-y-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const delay = e.target.elements.delay.value;
                sendAction("toggle_autoattack", { delay: delay ? parseInt(delay) : null });
              }}
              className="space-y-3"
            >
              <div>
                <p className="text-sm font-medium text-white">Oto-Saldırı (PvP)</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Humanize modunda hedefi vurur</p>
              </div>
              <div className="flex gap-2">
                <input
                  name="delay"
                  type="number"
                  placeholder="Gecikme (ms)"
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)", fontFamily: "JetBrains Mono, monospace" }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ background: "rgba(139, 92, 246, 0.2)", border: "1px solid rgba(139, 92, 246, 0.3)" }}
                >
                  Aç / Kapat
                </button>
              </div>
            </form>

            <div style={{ borderTop: "1px solid rgba(139, 92, 246, 0.06)" }} className="pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const button = e.target.elements.button.value;
                  const cps = parseFloat(e.target.elements.cps.value);
                  if (cps > 0) {
                    sendAction("toggle_autoclicker", { button, delay: Math.round(1000 / cps) });
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">AutoClicker</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>CPS değeri ile tıklama</p>
                </div>
                <div className="flex gap-2">
                  <select
                    name="button"
                    className="px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
                  >
                    <option value="left">Sol Tık (Kır)</option>
                    <option value="right">Sağ Tık (Kullan)</option>
                  </select>
                  <input
                    name="cps"
                    type="number"
                    step="0.1"
                    defaultValue="10"
                    className="w-20 px-3 py-2 rounded-lg text-sm text-white text-center"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)", fontFamily: "JetBrains Mono, monospace" }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: "rgba(139, 92, 246, 0.2)", border: "1px solid rgba(139, 92, 246, 0.3)" }}
                  >
                    Aç / Kapat
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(139, 92, 246, 0.1)" }}
        >
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <RefreshCw size={16} className="text-blue-400" />
            Döngüsel Komut
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const cmd = e.target.elements.cmd.value;
              const delay = e.target.elements.delay.value;
              if (cmd && delay) {
                const taskId = "task_" + Date.now();
                sendAction("add_auto_task", { taskId, cmd, delay });
                e.target.reset();
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Komut / Mesaj
              </label>
              <input
                name="cmd"
                type="text"
                placeholder="/tpa isim veya Selam"
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm text-white"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Gecikme (Saniye)
              </label>
              <input
                name="delay"
                type="number"
                placeholder="30"
                min="1"
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm text-white"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)", fontFamily: "JetBrains Mono, monospace" }}
                required
              />
            </div>
            <button
              type="submit"
              className="aura-btn w-full py-2.5 rounded-xl text-sm"
            >
              Döngüye Ekle
            </button>
          </form>
        </div>
      </div>

      <p className="text-xs text-center mt-6" style={{ color: "var(--color-text-muted)" }}>
        Eklenen görevler Terminal sekmesinden takip edilebilir
      </p>
    </div>
  );
}

function PlayerUtilsPanel({ bot, sendAction, players }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [spammerMsg, setSpammerMsg] = useState(bot.spammerMessage || "Selam!");
  const [spammerInt, setSpammerInt] = useState(bot.spammerInterval || 10);
  const [managerTab, setManagerTab] = useState("online");

  useEffect(() => {
    setSpammerMsg(bot.spammerMessage || "Selam!");
    setSpammerInt(bot.spammerInterval || 10);
  }, [bot.spammerMessage, bot.spammerInterval]);

  const handleToggleSpammer = (e) => {
    e.preventDefault();
    if (bot.spammerActive) {
      sendAction("stop_spammer");
    } else {
      sendAction("start_spammer", { message: spammerMsg, interval: parseInt(spammerInt, 10) });
    }
  };

  const isBlocked = (name) => bot.blockedPlayers?.includes(name);

  const filteredPlayers = (players || []).filter((p) =>
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 overflow-y-auto flex-1 space-y-6">
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <Users size={18} className="text-violet-400" />
        PlayerUtils Mod Özellikleri
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(139, 92, 246, 0.1)" }}
        >
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Radio size={16} className="text-violet-400" />
            Oyuncu Spammer (Oto-Fısıltı)
          </h4>
          <form onSubmit={handleToggleSpammer} className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Fısıltı Mesajı
              </label>
              <input
                type="text"
                value={spammerMsg}
                onChange={(e) => setSpammerMsg(e.target.value)}
                placeholder="Örn: Sunucumuza katilin!"
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm text-white"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
                required
                disabled={bot.spammerActive}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Gönderim Aralığı (Saniye)
              </label>
              <input
                type="number"
                value={spammerInt}
                onChange={(e) => setSpammerInt(e.target.value)}
                placeholder="10"
                min="1"
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm text-white"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)", fontFamily: "JetBrains Mono, monospace" }}
                required
                disabled={bot.spammerActive}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: bot.spammerActive
                  ? "rgba(239, 68, 68, 0.2)"
                  : "linear-gradient(135deg, #7c3aed, #6366f1)",
                color: "white",
                border: bot.spammerActive
                  ? "1px solid rgba(239, 68, 68, 0.3)"
                  : "1px solid rgba(139, 92, 246, 0.4)",
                boxShadow: bot.spammerActive ? "none" : "0 0 20px rgba(139, 92, 246, 0.3)",
              }}
            >
              {bot.spammerActive ? "Spammer Durdur" : "Spammer Başlat"}
            </button>
          </form>
        </div>

        <div
          className="rounded-xl p-5 flex flex-col"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(139, 92, 246, 0.1)", minHeight: "340px" }}
        >
          <div className="flex items-center justify-between mb-4 border-b border-violet-900/20 pb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users size={16} className="text-emerald-400" />
              Oyuncu & Engel Kontrolü
            </h4>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setManagerTab("online")}
                className="px-2 py-1 rounded text-[10px] font-semibold transition-all"
                style={{
                  background: managerTab === "online" ? "rgba(139, 92, 246, 0.2)" : "transparent",
                  color: managerTab === "online" ? "#c4b5fd" : "var(--color-text-muted)",
                }}
              >
                Çevrimiçi ({players?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setManagerTab("blocked")}
                className="px-2 py-1 rounded text-[10px] font-semibold transition-all"
                style={{
                  background: managerTab === "blocked" ? "rgba(139, 92, 246, 0.2)" : "transparent",
                  color: managerTab === "blocked" ? "#c4b5fd" : "var(--color-text-muted)",
                }}
              >
                Engelliler ({bot.blockedPlayers?.length || 0})
              </button>
            </div>
          </div>

          {managerTab === "online" ? (
            <>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Oyuncu adı ara..."
                className="w-full px-3 py-2 rounded-lg text-xs text-white mb-3"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
              />
              <div className="flex-1 overflow-y-auto max-h-48 space-y-1.5 pr-1">
                {filteredPlayers.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                    Aktif oyuncu bulunamadı.
                  </p>
                ) : (
                  filteredPlayers.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ background: "rgba(139, 92, 246, 0.04)", border: "1px solid rgba(139, 92, 246, 0.08)" }}
                    >
                      <span className="text-xs font-mono text-white flex items-center gap-2">
                        {name}
                        {isBlocked(name) && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-sans">
                            Engelli
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => sendAction(isBlocked(name) ? "unblock_player" : "block_player", name)}
                        className="px-2.5 py-1 rounded text-[10px] font-semibold transition-all"
                        style={{
                          background: isBlocked(name) ? "rgba(239, 68, 68, 0.15)" : "rgba(139, 92, 246, 0.15)",
                          color: isBlocked(name) ? "#f87171" : "#c4b5fd",
                          border: isBlocked(name) ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(139, 92, 246, 0.25)",
                        }}
                      >
                        {isBlocked(name) ? "Engeli Kaldır" : "Engelle"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = e.target.elements.blockName.value.trim();
                  if (name) {
                    sendAction("block_player", name);
                    e.target.reset();
                  }
                }}
                className="flex gap-2 mb-3"
              >
                <input
                  name="blockName"
                  type="text"
                  placeholder="Engellenecek oyuncu adı..."
                  className="flex-1 px-3 py-2 rounded-lg text-xs text-white"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all bg-rose-500/20 border border-rose-500/30"
                >
                  Engelle
                </button>
              </form>

              <div className="flex-1 overflow-y-auto max-h-48 space-y-1.5 pr-1">
                {!bot.blockedPlayers || bot.blockedPlayers.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                    Engellenen oyuncu yok.
                  </p>
                ) : (
                  bot.blockedPlayers.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ background: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.08)" }}
                    >
                      <span className="text-xs font-mono text-rose-300">{name}</span>
                      <button
                        onClick={() => sendAction("unblock_player", name)}
                        className="px-2.5 py-1 rounded text-[10px] font-semibold text-rose-400 transition-all bg-rose-500/15 border border-rose-500/25"
                      >
                        Engeli Kaldır
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsoleLog({ log, bots, showBot }) {
  const isChat = log.message.includes("[CHAT]");
  const isError = log.message.includes("Hata") || log.message.includes("hata") || log.message.includes("Error");
  const isSuccess = log.message.includes("bağlanıldı") || log.message.includes("başlatıldı");

  let color = "#9ca3af";
  if (isChat) color = "#fde68a";
  else if (isError) color = "#f87171";
  else if (isSuccess) color = "#6ee7b7";

  return (
    <div className="console-line flex gap-2" style={{ color }}>
      {showBot && bots && (
        <span style={{ color: "rgba(139, 92, 246, 0.6)", flexShrink: 0 }}>
          [{botNameFromId(log.id, bots)}]
        </span>
      )}
      <span>{log.message}</span>
    </div>
  );
}

function AuraActionBtn({ onClick, color, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}25`,
        color,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}28`;
        e.currentTarget.style.boxShadow = `0 0 15px ${color}25`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${color}18`;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function FormField({ label, icon, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
        style={{ color: "rgba(139, 92, 246, 0.7)" }}
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function AuraInput({ ...props }) {
  return (
    <input
      {...props}
      className="w-full px-4 py-2.5 rounded-xl text-sm text-white"
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        fontFamily: props.type === "number" || props.placeholder?.includes("IP") || props.placeholder?.includes("mc.")
          ? "JetBrains Mono, monospace"
          : "Inter, sans-serif",
      }}
    />
  );
}

function AuraSelect({ options, ...props }) {
  return (
    <select
      {...props}
      className="w-full px-4 py-2.5 rounded-xl text-sm text-white appearance-none cursor-pointer"
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
      }}
    >
      {options.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function botNameFromId(id, bots) {
  const bot = bots?.find((b) => b.id === id);
  return bot ? bot.username : "System";
}

export default App;
