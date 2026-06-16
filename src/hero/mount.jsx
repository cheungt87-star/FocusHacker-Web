import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Stage } from "./animations.jsx";
import { Desktop } from "./fh-scene.jsx";

function HeroAnimation({ hostEl }) {
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!hostEl || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setPlaying(entry.isIntersecting);
        });
      },
      { threshold: 0.15 },
    );
    io.observe(hostEl);
    return () => io.disconnect();
  }, [hostEl]);

  return (
    <Stage
        width={1440}
        height={900}
        duration={28}
        loop
        autoplay
        background="#dfe3ea"
        playing={playing}
        onPlayingChange={setPlaying}
      >
        <Desktop
          tw={{
            payoffStyle: "hero",
            streakAccent: "#4A9B6F",
            flameStyle: "emoji",
          }}
        />
    </Stage>
  );
}

export function mountHeroAnimation(container) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    container.setAttribute(
      "aria-label",
      "FocusHacker demo: guided focus sessions on Mac with distraction blocking and streak tracking.",
    );
    return;
  }

  container.setAttribute(
    "aria-label",
    "Animated demo: starting a FocusHacker session on Mac, blocking distractions, and completing a focus streak.",
  );

  createRoot(container).render(<HeroAnimation hostEl={container} />);
}
