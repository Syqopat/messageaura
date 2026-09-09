import React, { useRef, useCallback, useEffect } from "react";

function JoystickPad({ onMove, onStop, size = 120, label }) {
  const padRef = useRef(null);
  const knobRef = useRef(null);
  const activeRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0 });

  const maxDistance = size / 2 - 15;

  const getRelativePos = useCallback(
    (clientX, clientY) => {
      const pad = padRef.current;
      if (!pad) return { x: 0, y: 0 };
      const rect = pad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;

      
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }

      return {
        x: dx / maxDistance, 
        y: dy / maxDistance, 
        px: dx, 
        py: dy, 
      };
    },
    [maxDistance],
  );

  const handleStart = useCallback(
    (clientX, clientY) => {
      activeRef.current = true;
      const pos = getRelativePos(clientX, clientY);
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${pos.px}px, ${pos.py}px)`;
      }
      onMove(pos.x, pos.y);
    },
    [getRelativePos, onMove],
  );

  const handleMove = useCallback(
    (clientX, clientY) => {
      if (!activeRef.current) return;
      const pos = getRelativePos(clientX, clientY);
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${pos.px}px, ${pos.py}px)`;
      }
      onMove(pos.x, pos.y);
    },
    [getRelativePos, onMove],
  );

  const handleEnd = useCallback(() => {
    activeRef.current = false;
    if (knobRef.current) {
      knobRef.current.style.transform = "translate(0px, 0px)";
    }
    onStop();
  }, [onStop]);

  
  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;

    const onPointerDown = (e) => {
      e.preventDefault();
      pad.setPointerCapture(e.pointerId);
      handleStart(e.clientX, e.clientY);
    };

    const onPointerMove = (e) => {
      
      if (pad.hasPointerCapture(e.pointerId)) {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    };

    const onPointerUpOrCancel = (e) => {
      e.preventDefault();
      if (pad.hasPointerCapture(e.pointerId)) {
        pad.releasePointerCapture(e.pointerId);
      }
      handleEnd();
    };

    pad.addEventListener("pointerdown", onPointerDown);
    pad.addEventListener("pointermove", onPointerMove);
    pad.addEventListener("pointerup", onPointerUpOrCancel);
    pad.addEventListener("pointercancel", onPointerUpOrCancel);

    return () => {
      pad.removeEventListener("pointerdown", onPointerDown);
      pad.removeEventListener("pointermove", onPointerMove);
      pad.removeEventListener("pointerup", onPointerUpOrCancel);
      pad.removeEventListener("pointercancel", onPointerUpOrCancel);
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={padRef}
        className="rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 relative cursor-pointer select-none shadow-lg"
        style={{ width: size, height: size }}
      >
        {}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[1px] h-1/2 bg-white/10 absolute"></div>
          <div className="h-[1px] w-1/2 bg-white/10 absolute"></div>
        </div>

        {}
        <div
          ref={knobRef}
          className="absolute rounded-full bg-gradient-to-br from-white/40 to-white/20 border border-white/30 shadow-md transition-transform duration-75"
          style={{
            width: 30,
            height: 30,
            left: "50%",
            top: "50%",
            marginLeft: -15,
            marginTop: -15,
          }}
        ></div>
      </div>
      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

export default function GameControls({ socket, botId }) {
  const lookIntervalRef = useRef(null);
  const lookDelta = useRef({ x: 0, y: 0 });

  const sendAction = useCallback(
    (action, data) => {
      if (socket && botId) {
        socket.emit("bot_action", { id: botId, action, data });
      }
    },
    [socket, botId],
  );

  
  const handleMoveJoystick = useCallback(
    (x, y) => {
      sendAction("joystick_move", { moveX: x, moveY: y });
    },
    [sendAction],
  );

  const handleMoveStop = useCallback(() => {
    sendAction("joystick_stop");
  }, [sendAction]);

  
  const handleLookJoystick = useCallback(
    (x, y) => {
      lookDelta.current = { x, y };

      if (!lookIntervalRef.current) {
        lookIntervalRef.current = setInterval(() => {
          const { x: lx, y: ly } = lookDelta.current;
          if (Math.abs(lx) > 0.05 || Math.abs(ly) > 0.05) {
            sendAction("look", {
              deltaYaw: -lx * 0.05, 
              deltaPitch: ly * 0.03, 
            });
          }
        }, 50); 
      }
    },
    [sendAction],
  );

  const handleLookStop = useCallback(() => {
    lookDelta.current = { x: 0, y: 0 };
    if (lookIntervalRef.current) {
      clearInterval(lookIntervalRef.current);
      lookIntervalRef.current = null;
    }
  }, []);

  
  useEffect(() => {
    return () => {
      if (lookIntervalRef.current) clearInterval(lookIntervalRef.current);
    };
  }, []);

  const handleJump = useCallback(() => {
    sendAction("jump");
  }, [sendAction]);

  const handleLeftClick = useCallback(() => {
    sendAction("left_click");
  }, [sendAction]);

  const handleRightClick = useCallback(() => {
    sendAction("right_click");
  }, [sendAction]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-end justify-between px-6 pb-6">
        {}
        <div className="pointer-events-auto">
          <JoystickPad
            onMove={handleMoveJoystick}
            onStop={handleMoveStop}
            size={130}
            label="Hareket"
          />
        </div>

        {}
        <div className="pointer-events-auto flex gap-4 mb-20">
          <div className="flex flex-col items-center gap-2">
            <button
              onMouseDown={handleLeftClick}
              onTouchStart={handleLeftClick}
              className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-lg shadow-lg active:bg-white/30 active:scale-95 transition-all select-none"
            >
              L
            </button>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              Kır/Vur
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onMouseDown={handleJump}
              onTouchStart={handleJump}
              className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-lg shadow-lg active:bg-white/30 active:scale-95 transition-all select-none"
            >
              ⬆
            </button>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              Zıpla
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onMouseDown={handleRightClick}
              onTouchStart={handleRightClick}
              className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-lg shadow-lg active:bg-white/30 active:scale-95 transition-all select-none"
            >
              R
            </button>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              Kullan
            </span>
          </div>
        </div>

        {}
        <div className="pointer-events-auto">
          <JoystickPad
            onMove={handleLookJoystick}
            onStop={handleLookStop}
            size={130}
            label="Bakış"
          />
        </div>
      </div>
    </div>
  );
}
