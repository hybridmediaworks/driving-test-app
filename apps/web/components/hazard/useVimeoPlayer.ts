"use client";

import { useEffect, useState } from "react";

/**
 * Minimal typed surface of the Vimeo Player SDK we actually use. The SDK is loaded from Vimeo's
 * own CDN (player.js) at runtime rather than bundled — it's the officially supported way to drive
 * an embedded player and needs no build wiring.
 */
export type VimeoPlayer = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  getCurrentTime: () => Promise<number>;
  setCurrentTime: (seconds: number) => Promise<number>;
  getDuration: () => Promise<number>;
  setVolume: (volume: number) => Promise<number>;
  setMuted: (muted: boolean) => Promise<boolean>;
  on: (event: string, handler: (data: never) => void) => void;
  off: (event: string, handler?: (data: never) => void) => void;
  destroy: () => Promise<void>;
  ready: () => Promise<void>;
};

type VimeoGlobal = { Player: new (el: HTMLElement, options?: Record<string, unknown>) => VimeoPlayer };

const SDK_SRC = "https://player.vimeo.com/api/player.js";
let sdkPromise: Promise<VimeoGlobal> | null = null;

function loadVimeoSdk(): Promise<VimeoGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const existing = (window as unknown as { Vimeo?: VimeoGlobal }).Vimeo;
  if (existing) return Promise.resolve(existing);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.onload = () => {
      const vimeo = (window as unknown as { Vimeo?: VimeoGlobal }).Vimeo;
      if (vimeo) resolve(vimeo);
      else reject(new Error("Vimeo SDK loaded but global missing"));
    };
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("Failed to load the Vimeo player"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

/**
 * Mounts a Vimeo player into `containerRef` for the given video id and hands back the player
 * instance once it's ready. Rebuilds if `videoId` changes; tears down on unmount.
 */
export function useVimeoPlayer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  videoId: string | null,
  muted = false,
) {
  const [player, setPlayer] = useState<VimeoPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;
    let cancelled = false;
    let created: VimeoPlayer | null = null;
    const host = containerRef.current;

    loadVimeoSdk()
      .then((Vimeo) => {
        if (cancelled || !host) return;
        created = new Vimeo.Player(host, {
          id: Number(videoId),
          controls: false,
          keyboard: false,
          pip: false,
          title: false,
          byline: false,
          portrait: false,
          dnt: true,
          responsive: true,
          muted,
        });
        created.ready().then(() => {
          if (!cancelled) setPlayer(created);
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Video player failed to load");
      });

    return () => {
      cancelled = true;
      setPlayer(null);
      created?.destroy().catch(() => {});
      if (host) host.innerHTML = "";
    };
    // `muted` is only the initial state — callers drive mute/volume live via the player instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, containerRef]);

  return { player, error };
}
