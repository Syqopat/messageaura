import React, { useState, useEffect } from "react";

export default function MinecraftViewer({ socket, botId, bot }) {
  const [loading, setLoading] = useState(true);
  const [scoreboard, setScoreboard] = useState(null);

  useEffect(() => {
    if (!socket || !botId) return;
    const handleScoreboard = (data) => {
      if (data.id === botId) {
        if (data.title && data.items.length > 0) {
          setScoreboard({ title: data.title, items: data.items });
        } else {
          setScoreboard(null);
        }
      }
    };
    socket.on("bot_scoreboard", handleScoreboard);
    return () => socket.off("bot_scoreboard", handleScoreboard);
  }, [socket, botId]);

  if (!bot?.viewerPort) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-emerald-400 font-mono text-sm">
          Görüntüleyici başlatılıyor (Port bekleniyor)...
        </div>
      </div>
    );
  }

  
  const hostname = window.location.hostname;
  const iframeUrl = `http://${hostname}:${bot.viewerPort}`;

  return (
    <div className="relative w-full h-full bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 pointer-events-none">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg font-medium">
              Prismarine Viewer Yükleniyor...
            </p>
            <p className="text-neutral-400 text-sm mt-2">
              Orijinal Minecraft Kaplamaları Hazırlanıyor
            </p>
          </div>
        </div>
      )}

      <iframe
        src={iframeUrl}
        className="w-full h-full border-none block"
        onLoad={() => setLoading(false)}
        title="Minecraft Viewer"
      />

      {}
      {scoreboard && (
        <div className="absolute top-[40%] right-4 -translate-y-1/2 z-20 bg-black/60 p-2 min-w-[160px] max-w-[250px] font-minecraft pointer-events-none text-shadow-sm select-none">
          <h3 className="text-yellow-400 font-bold text-center border-b-2 border-white/10 pb-1 mb-1">
            {scoreboard.title}
          </h3>
          <ul className="text-white text-[13px] leading-relaxed flex flex-col-reverse">
            {scoreboard.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span className="truncate">{item.name}</span>
                <span className="text-red-500 font-bold ml-4">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
