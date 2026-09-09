import React, { useRef, useEffect, useCallback } from "react";

export default function MouseKeyboardControls({ socket, botId }) {
  const overlayRef = useRef(null);

  const sendAction = useCallback(
    (action, data) => {
      if (socket && botId) {
        socket.emit("bot_action", { id: botId, action, data });
      }
    },
    [socket, botId],
  );

  useEffect(() => {
    const handlePointerLockChange = () => {
      if (document.pointerLockElement === overlayRef.current) {
        
        console.log("Pointer locked");
      } else {
        
        console.log("Pointer unlocked");
      }
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    return () =>
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange,
      );
  }, []);

  const handleClick = async (e) => {
    if (document.pointerLockElement !== overlayRef.current) {
      try {
        await overlayRef.current.requestPointerLock();
      } catch (err) {
        console.error("Pointer lock failed", err);
      }
    } else {
      
      if (e.button === 0) {
        
        sendAction("left_click");
      } else if (e.button === 2) {
        
        sendAction("right_click");
      }
    }
  };

  const handleMouseMove = (e) => {
    if (document.pointerLockElement === overlayRef.current) {
      
      
      
      const deltaYaw = -e.movementX * 0.002;
      const deltaPitch = -e.movementY * 0.002;
      sendAction("look", { deltaYaw, deltaPitch });
    }
  };

  useEffect(() => {
    const keyMap = {
      w: "forward",
      a: "left", 
      s: "back",
      d: "right",
      " ": "jump",
      shift: "sneak",
      control: "sprint",
    };

    const handleKeyDown = (e) => {
      if (document.pointerLockElement !== overlayRef.current) return;
      
      e.preventDefault();
      e.stopPropagation();

      const key = e.key.toLowerCase();

      if (key === "control") {
        const isSprinting = !overlayRef.current.isSprinting;
        overlayRef.current.isSprinting = isSprinting;
        sendAction("set_control", { state: "sprint", value: isSprinting });
      } else if (keyMap[key] && key !== "control") {
        sendAction("set_control", { state: keyMap[key], value: true });
      } else if (key >= "1" && key <= "9") {
        sendAction("set_hotbar_slot", { slot: parseInt(key) - 1 });
      } else if (key === "q") {
        sendAction("drop_item");
      } else if (key === "e") {
        document.exitPointerLock();
        window.dispatchEvent(new CustomEvent("toggle_inventory"));
      }
    };

    const handleKeyUp = (e) => {
      if (document.pointerLockElement !== overlayRef.current) return;
      
      e.preventDefault();
      e.stopPropagation();

      const key = e.key.toLowerCase();

      if (keyMap[key] && key !== "control") {
        sendAction("set_control", { state: keyMap[key], value: false });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sendAction]);

  return (
    <div
      ref={overlayRef}
      onMouseDown={handleClick}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute inset-0 z-10 cursor-crosshair group flex items-center justify-center"
      title="Oyuna odaklanmak için tıklayın"
    >
      {}
      <div className="w-4 h-4 relative opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2 shadow-sm mix-blend-difference"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white -translate-x-1/2 shadow-sm mix-blend-difference"></div>
      </div>
    </div>
  );
}
