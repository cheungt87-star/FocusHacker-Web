// @ds-adherence-ignore -- hero timeline runtime (raw elements/hex/px by design)

import React from "react";

// Easing helpers used by fh-scene.jsx tweens.
export const Easing = {
  linear: (t) => t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const TimelineContext = React.createContext({
  time: 0,
  duration: 10,
  playing: false,
});

export const useTime = () => React.useContext(TimelineContext).time;

export function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = "#f6f4ef",
  loop = true,
  autoplay = true,
  playing: playingProp,
  onPlayingChange,
  children,
}) {
  const [time, setTime] = React.useState(0);
  const [internalPlaying, setInternalPlaying] = React.useState(autoplay);
  const playing = playingProp !== undefined ? playingProp : internalPlaying;
  const setPlaying = React.useCallback(
    (value) => {
      const next = typeof value === "function" ? value(playing) : value;
      if (onPlayingChange) onPlayingChange(next);
      else setInternalPlaying(next);
    },
    [playing, onPlayingChange],
  );
  const [scale, setScale] = React.useState(1);

  const stageRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);

  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const s = Math.min(el.clientWidth / width, el.clientHeight / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [width, height]);

  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;
          else {
            next = duration;
            setPlaying(false);
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop, setPlaying]);

  const ctxValue = React.useMemo(
    () => ({ time, duration, playing, setTime, setPlaying }),
    [time, duration, playing, setPlaying],
  );

  return (
    <div
      ref={stageRef}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "transparent",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <div
          style={{
            width,
            height,
            background,
            position: "relative",
            transform: `scale(${scale})`,
            transformOrigin: "center",
            flexShrink: 0,
            boxShadow: "0 12px 40px rgba(43,43,43,0.12)",
            overflow: "hidden",
          }}
        >
          <TimelineContext.Provider value={ctxValue}>
            {children}
          </TimelineContext.Provider>
        </div>
      </div>
    </div>
  );
}
