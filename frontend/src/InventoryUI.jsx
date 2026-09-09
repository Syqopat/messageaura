import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Backpack } from "lucide-react";

export default function InventoryUI({ socket, botId, controlMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inventory, setInventory] = useState(new Array(46).fill(null));
  const [quickBarSlot, setQuickBarSlot] = useState(0);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !botId) return;

    const handleUpdate = (data) => {
      if (data.id === botId) {
        
        const newInv = new Array(46).fill(null);
        data.items.forEach((item) => {
          if (item && item.slot !== undefined) {
            newInv[item.slot] = item;
          }
        });
        setInventory(newInv);
        setQuickBarSlot(data.quickBarSlot || 0);
      }
    };

    const handleHotbarUpdate = (data) => {
      if (data.id === botId) setQuickBarSlot(data.slot);
    };

    const handleWindowOpened = (data) => {
      if (data.id === botId) {
        setIsOpen(true);
      }
    };

    socket.on("inventory_full_update", handleUpdate);
    socket.on("hotbar_update", handleHotbarUpdate);
    socket.on("window_opened", handleWindowOpened);

    return () => {
      socket.off("inventory_full_update", handleUpdate);
      socket.off("hotbar_update", handleHotbarUpdate);
      socket.off("window_opened", handleWindowOpened);
    };
  }, [socket, botId]);

  useEffect(() => {
    const toggleInv = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle_inventory", toggleInv);
    return () => window.removeEventListener("toggle_inventory", toggleInv);
  }, []);

  const sendAction = useCallback(
    (action, data) => {
      if (socket && botId) {
        socket.emit("bot_action", { id: botId, action, data });
      }
    },
    [socket, botId],
  );

  const handleSlotClick = (e, slotId) => {
    if (controlMode !== "default") return; 

    e.preventDefault();
    e.stopPropagation();

    const isRightClick = e.button === 2;
    const isShift = e.shiftKey;
    const mouseButton = isRightClick ? 1 : 0;
    const mode = isShift ? 1 : 0; 

    sendAction("inventory_click", { slot: slotId, mouseButton, mode });
  };

  const closeInventory = () => {
    setIsOpen(false);
    sendAction("close_window");
  };

  const renderSlot = (slotId, label = "") => {
    const item = inventory[slotId];
    const isSelectedHotbar =
      slotId >= 36 && slotId <= 44 && slotId - 36 === quickBarSlot;

    return (
      <div
        key={slotId}
        onMouseDown={(e) => handleSlotClick(e, slotId)}
        onMouseEnter={() => {
          if (item) {
            hoverTimeoutRef.current = setTimeout(
              () => setHoveredSlot(slotId),
              1000,
            );
          }
        }}
        onMouseLeave={() => {
          clearTimeout(hoverTimeoutRef.current);
          setHoveredSlot(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-12 h-12 bg-[#8b8b8b] border-[3px] ${isSelectedHotbar && !isOpen ? "border-white" : "border-t-[#373737] border-l-[#373737] border-b-white border-r-white"} flex items-center justify-center relative hover:bg-white/20 transition-colors cursor-pointer group`}
      >
        {hoveredSlot === slotId && item && (
          <div className="absolute top-[-10px] left-full ml-2 z-[100] bg-black/90 border-2 border-[#3700b3] text-white p-2 rounded shadow-xl whitespace-nowrap pointer-events-none text-sm font-minecraft">
            <span className="text-[#a855f7] font-bold">
              {item.displayName || item.name}
            </span>
          </div>
        )}
        {item ? (
          <div className="relative w-8 h-8 group flex items-center justify-center">
            {}
            <div
              className="w-full h-full flex items-center justify-center relative"
              title={item.displayName || item.name}
            >
              <img
                src={`/textures/assets/minecraft/textures/item/${item.name}.png`}
                alt={item.name}
                className="max-w-[28px] max-h-[28px] object-contain drop-shadow-md"
                onError={(e) => {
                  
                  if (!e.target.src.includes("/block/")) {
                    e.target.src = `/textures/assets/minecraft/textures/block/${item.name}.png`;
                  } else {
                    
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML +=
                      '<div class="w-6 h-6 bg-[#34d399] border-2 border-[#064e3b] shadow-sm"></div>';
                  }
                }}
              />
            </div>
            {item.count > 1 && (
              <span
                className="absolute -bottom-2 -right-2 text-[14px] font-bold text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] z-10"
                style={{
                  textShadow:
                    "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                }}
              >
                {item.count}
              </span>
            )}
          </div>
        ) : (
          label && (
            <span className="text-white/30 text-[10px] uppercase font-bold pointer-events-none text-center leading-tight">
              {label}
            </span>
          )
        )}
      </div>
    );
  };

  return (
    <>
      {}
      {controlMode === "joystick" && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-4 left-4 z-40 bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/20 text-white shadow-lg active:scale-95 transition-all"
        >
          <Backpack size={24} />
        </button>
      )}

      {}
      {isOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div
            className="bg-[#c6c6c6] p-4 border-4 border-black rounded-sm shadow-[inset_4px_4px_0_rgba(255,255,255,0.5),inset_-4px_-4px_0_rgba(85,85,85,0.5)] select-none"
            style={{ imageRendering: "pixelated" }}
          >
            {}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#373737] font-bold tracking-tight text-lg drop-shadow-sm">
                Envanter
              </h2>
              <button
                onClick={closeInventory}
                className="text-[#373737] hover:text-red-600 bg-[#8b8b8b] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white w-8 h-8 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {}
            <div className="flex gap-4">
              {}
              <div className="flex flex-col gap-1">
                {renderSlot(5, "Kask")}
                {renderSlot(6, "Göğüs")}
                {renderSlot(7, "Pantolon")}
                {renderSlot(8, "Bot")}
              </div>

              {}
              <div className="w-28 h-[204px] bg-black/10 border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white flex items-center justify-center">
                <span className="text-[#373737] text-xs font-bold">Oyuncu</span>
              </div>

              {}
              <div className="flex flex-col justify-end pb-1">
                {renderSlot(45, "Sol El")}
              </div>

              {}
              <div className="flex flex-col ml-4 mt-2">
                <span className="text-[#373737] text-sm font-bold mb-1">
                  Üretim
                </span>
                <div className="flex items-center gap-4">
                  <div className="grid grid-cols-2 gap-1 bg-[#8b8b8b] p-1 border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white">
                    {renderSlot(1)}
                    {renderSlot(2)}
                    {renderSlot(3)}
                    {renderSlot(4)}
                  </div>
                  <div className="text-[#373737] font-bold text-2xl">➔</div>
                  <div className="scale-125 origin-left">
                    {renderSlot(0, "Sonuç")}
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="mt-6 mb-2">
              <div className="grid grid-cols-9 gap-1">
                {[...Array(27)].map((_, i) => renderSlot(i + 9))}
              </div>
            </div>

            {}
            <div className="mt-2 flex items-center">
              <div className="grid grid-cols-9 gap-1">
                {[...Array(9)].map((_, i) => renderSlot(i + 36))}
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {!isOpen && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/60 p-2 border-4 border-black shadow-[inset_4px_4px_0_rgba(255,255,255,0.2)] pointer-events-auto">
          <div className="flex gap-1">
            {[...Array(9)].map((_, i) =>
              renderSlot(i + 36, (i + 1).toString()),
            )}
          </div>
        </div>
      )}
    </>
  );
}
