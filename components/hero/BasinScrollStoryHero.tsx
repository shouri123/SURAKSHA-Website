"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BasinScrollStoryHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const plateRef = useRef<HTMLImageElement>(null);
  const camMainRef = useRef<HTMLDivElement>(null);
  const camFrontRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const visionRef = useRef<HTMLDivElement>(null);
  const acctParaRef = useRef<HTMLParagraphElement>(null);
  const credRef = useRef<HTMLDivElement>(null);
  const gaugeCardRef = useRef<HTMLDivElement>(null);
  const stageCounterRef = useRef<HTMLSpanElement>(null);
  const sparkPolyRef = useRef<SVGPolylineElement>(null);
  const featsRef = useRef<HTMLDivElement>(null);
  const progBarRef = useRef<HTMLDivElement>(null);
  const layerL0Ref = useRef<HTMLDivElement>(null);
  const layerL1Ref = useRef<HTMLDivElement>(null);
  const layerL2Ref = useRef<HTMLDivElement>(null);
  const layerL3Ref = useRef<HTMLDivElement>(null);
  const layerL4Ref = useRef<HTMLDivElement>(null);
  const rk1Ref = useRef<HTMLDivElement>(null);
  const rk3Ref = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);

  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [activeFeat, setActiveFeat] = useState<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!video || !canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const FPS = 24;
    let NF = 121;
    let frames: (Blob | null)[] = new Array(NF).fill(null);
    let busy = false;
    let want = 0;
    let shown = -1;

    // Offscreen grab canvas
    const grabCanvas = document.createElement("canvas");
    grabCanvas.width = 1600;
    grabCanvas.height = 900;
    const grabCtx = grabCanvas.getContext("2d");

    function clamp(v: number, min = 0, max = 1) {
      return Math.max(min, Math.min(max, v));
    }

    function seg(p: number, a: number, b: number) {
      return clamp((p - a) / (b - a));
    }

    function ease(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function resizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      if (shown >= 0 && frames[shown]) {
        drawBitmap(frames[shown]!);
      }
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function storeFrame(index: number, blob: Blob) {
      if (!frames[index]) {
        frames[index] = blob;
        if (index === want) {
          drawWant();
        }
      }
    }

    function grabCurrentFrame(index: number) {
      if (!grabCtx || !video) return;
      try {
        grabCtx.drawImage(video, 0, 0, 1600, 900);
        grabCanvas.toBlob(
          (blob) => {
            if (blob) storeFrame(index, blob);
          },
          "image/jpeg",
          0.86
        );
      } catch (e) {}
    }

    function initVideoCache() {
      if (!video) return;
      if (video.duration) {
        NF = Math.max(2, Math.round(video.duration * 24));
        frames = new Array(NF).fill(null);
      }

      // Grab frame 0 immediately
      if (grabCtx) {
        try {
          grabCtx.drawImage(video, 0, 0, 1600, 900);
          grabCanvas.toBlob(
            (blob) => {
              if (blob) {
                frames[0] = blob;
                drawWant();
              }
            },
            "image/jpeg",
            0.9
          );
        } catch (e) {}
      }

      if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
        const onFrame = (_now: number, metadata: VideoFrameCallbackMetadata) => {
          const i = Math.min(NF - 1, Math.round(metadata.mediaTime * 24));
          if (!frames[i]) {
            grabCurrentFrame(i);
          }
          if (i < NF - 1 && !video.ended) {
            video.requestVideoFrameCallback(onFrame);
          }
        };
        video.requestVideoFrameCallback(onFrame);
        video.play().catch(() => {});
      } else {
        let seekIdx = 1;
        const onSeek = () => {
          grabCurrentFrame(seekIdx);
          seekIdx++;
          if (seekIdx < NF) {
            video.currentTime = Math.min(seekIdx / 24, video.duration - 0.01);
          }
        };
        video.addEventListener("seeked", onSeek);
        video.currentTime = 1 / 24;
      }
    }

    if (video.readyState >= 2) {
      initVideoCache();
    } else {
      video.addEventListener("loadeddata", initVideoCache, { once: true });
    }

    function drawBitmap(blob: Blob) {
      if (!blob || !canvas || !ctx) return;
      createImageBitmap(blob)
        .then((bmp) => {
          const cw = canvas.width;
          const ch = canvas.height;
          const bw = bmp.width;
          const bh = bmp.height;
          const scale = Math.max(cw / bw, ch / bh);
          const dw = bw * scale;
          const dh = bh * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;
          ctx.drawImage(bmp, dx, dy, dw, dh);
          bmp.close();
        })
        .catch(() => {});
    }

    function nearestCached(target: number): number {
      if (frames[target]) return target;
      for (let k = 1; k < NF; k++) {
        if (target - k >= 0 && frames[target - k]) return target - k;
        if (target + k < NF && frames[target + k]) return target + k;
      }
      return -1;
    }

    function drawWant() {
      if (busy || !canvas || !ctx) return;
      const target = nearestCached(want);
      if (target < 0 || target === shown) return;

      busy = true;
      const blob = frames[target];
      if (!blob) {
        busy = false;
        return;
      }

      createImageBitmap(blob)
        .then((bmp) => {
          const cw = canvas.width;
          const ch = canvas.height;
          const bw = bmp.width;
          const bh = bmp.height;
          const scale = Math.max(cw / bw, ch / bh);
          const dw = bw * scale;
          const dh = bh * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;
          ctx.drawImage(bmp, dx, dy, dw, dh);
          bmp.close();
          shown = target;
          busy = false;
          if (want !== target && nearestCached(want) !== shown) {
            drawWant();
          }
        })
        .catch(() => {
          busy = false;
        });
    }

    // Hero copy alignment with fern tips
    function layoutHero() {
      const heroCopy = heroCopyRef.current;
      if (!heroCopy) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const h1 = heroCopy.querySelector("h1");

      if (W <= 820) {
        heroCopy.style.top = "";
        if (h1) h1.style.fontSize = "";
        return;
      }

      const bw = W * 1.06;
      const bh = H * 1.12;
      const k = Math.max(bw / 1600, bh / 900);
      const fernTop = -0.09 * H + (bh - 900 * k) / 2 + 245 * k + 0.06 * H;

      let fs = Math.min(104, 72 * k);
      if (h1) h1.style.fontSize = `${fs}px`;

      const line = heroCopy.querySelector(".line-wrap") as HTMLElement | null;
      if (line && line.scrollWidth > W * 0.86) {
        fs = (fs * (W * 0.86)) / line.scrollWidth;
        if (h1) h1.style.fontSize = `${fs}px`;
      }

      const blockHeight = heroCopy.offsetHeight;
      const blockTop = fernTop + 0.5 * fs - blockHeight;
      heroCopy.style.top = `${blockTop}px`;
    }

    window.addEventListener("resize", layoutHero);
    if (document.fonts) {
      document.fonts.ready.then(layoutHero);
    }
    setTimeout(layoutHero, 150);

    // Sparkline calculation
    let sparkLen = 250;
    const sparkPoly = sparkPolyRef.current;
    if (sparkPoly && sparkPoly.getTotalLength) {
      try {
        sparkLen = sparkPoly.getTotalLength();
        sparkPoly.style.strokeDasharray = `${sparkLen}`;
        sparkPoly.style.strokeDashoffset = `${sparkLen}`;
      } catch (e) {}
    }

    // Pointer coordinates
    let mx = 0,
      my = 0;
    let sx = 0,
      sy = 0;

    const onPointerMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onPointerMove);

    // Stats counter trigger
    let statsCounted = false;
    function triggerStats() {
      if (statsCounted) return;
      const grid = statsGridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.6) {
        statsCounted = true;
        const statVals = grid.querySelectorAll<HTMLElement>(".stat-val");
        const duration = 1600;
        const start = performance.now();

        const step = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = ease(p);

          statVals.forEach((el) => {
            const target = parseFloat(el.getAttribute("data-val") || "0");
            const suffix = el.getAttribute("data-suffix") || "";
            const type = el.getAttribute("data-type");

            const current = target * eased;
            if (type === "float") {
              el.innerText = current.toFixed(1) + suffix;
            } else {
              el.innerText = Math.round(current) + suffix;
            }
          });

          if (p < 1) {
            requestAnimationFrame(step);
          }
        };
        requestAnimationFrame(step);
      }
    }

    // rAF loop
    let sp = 0;
    let lastTime = performance.now();
    let animId: number;

    function frame(now: number) {
      const dt = Math.min(64, now - lastTime);
      lastTime = now;

      // Pointer smoothing
      sx += (mx - sx) * 0.06;
      sy += (my - sy) * 0.06;

      // Container scroll progress
      if (container) {
        const rect = container.getBoundingClientRect();
        const totalScroll = container.offsetHeight - window.innerHeight;
        const p = clamp(-rect.top / totalScroll);

        const decay = 1 - Math.pow(0.86, dt / 16.7);
        sp += (p - sp) * decay;
        if (Math.abs(p - sp) < 0.0002) sp = p;
      }

      // Video scrub calculation
      const vp = ease(seg(sp, 0.05, 0.7));
      want = Math.round(vp * (NF - 1));
      drawWant();

      // Camera transforms
      const camY = -sy * 12 + (1 - vp) * window.innerHeight * 0.06;
      const camScale = 1 + 0.02 * (1 - vp);
      const camTransform = `translate3d(${-sx * 18}px, ${camY}px, 0) scale(${camScale})`;

      if (camMainRef.current) camMainRef.current.style.transform = camTransform;
      if (camFrontRef.current) camFrontRef.current.style.transform = camTransform;

      // Plate & Cut-out dissolve
      const ho = shown < 0 ? 0 : shown === 0 ? seg(sp, 0.06, 0.105) : 1;
      const plateOpacity = 1 - ho;
      if (plateRef.current) {
        plateRef.current.style.opacity = `${plateOpacity}`;
        plateRef.current.style.display = plateOpacity <= 0 ? "none" : "block";
      }
      if (camFrontRef.current) {
        camFrontRef.current.style.opacity = `${plateOpacity}`;
        camFrontRef.current.style.visibility = plateOpacity <= 0 ? "hidden" : "visible";
      }

      // Progress bar
      if (progBarRef.current) {
        progBarRef.current.style.transform = `scaleX(${sp})`;
      }

      // Rocks fly-past
      const fp = seg(sp, 0.02, 0.2);
      const fe = fp * fp;
      const rocks = [rk1Ref.current, rk3Ref.current];
      if (fp >= 1) {
        rocks.forEach((rk) => {
          if (rk) rk.style.display = "none";
        });
      } else {
        rocks.forEach((rk) => {
          if (rk) {
            rk.style.display = "block";
            const rx = parseFloat(rk.getAttribute("data-x") || "0");
            const ry = parseFloat(rk.getAttribute("data-y") || "0");
            const rd = parseFloat(rk.getAttribute("data-d") || "1");
            const tx = rx * fp * 70 + sx * -24 * rd;
            const ty = ry * fp * 60 + sy * -16 * rd;
            const sc = 1 + fe * 1.6 * rd;
            const bl = fe * 5 * rd;
            rk.style.transform = `translate3d(${tx}vw, ${ty}vh, 0) scale(${sc})`;
            rk.style.filter = `blur(${bl}px)`;
          }
        });
      }

      // Hero Copy (L0 & L1)
      const h = seg(sp, 0.02, 0.1);
      if (h >= 1) {
        if (layerL0Ref.current) layerL0Ref.current.style.visibility = "hidden";
        if (layerL1Ref.current) layerL1Ref.current.style.visibility = "hidden";
      } else {
        if (layerL0Ref.current) layerL0Ref.current.style.visibility = "visible";
        if (layerL1Ref.current) layerL1Ref.current.style.visibility = "visible";

        if (heroCopyRef.current) {
          heroCopyRef.current.style.transform = `translate3d(${-sx * 10}px, ${-h * 80 - sy * 6}px, 0) scale(${1 + h * 0.12})`;
          heroCopyRef.current.style.filter = `blur(${h * 14}px)`;
          heroCopyRef.current.style.opacity = `${1 - h}`;
        }

        const hudAlpha = 1 - seg(sp, 0.02, 0.08);
        if (hudRef.current) {
          hudRef.current.style.transform = `translate3d(${sx * 26}px, ${sy * 18 - h * 40}px, 0)`;
          hudRef.current.style.opacity = `${hudAlpha}`;
        }

        const captAlpha = 1 - seg(sp, 0.01, 0.05);
        if (captionRef.current) captionRef.current.style.opacity = `${captAlpha}`;
        if (scrollHintRef.current) scrollHintRef.current.style.opacity = `${captAlpha}`;
      }

      // Fog bank (L1.5)
      const fg = ease(seg(sp, 0.38, 0.47));
      if (fogRef.current) {
        if (fg <= 0) {
          fogRef.current.style.visibility = "hidden";
        } else {
          fogRef.current.style.visibility = "visible";
          fogRef.current.style.opacity = `${fg}`;
          const fogX = (fg - 1) * 18 + sx * -10;
          const fogY = sy * -6;
          fogRef.current.style.transform = `translate3d(${fogX}vw, ${fogY}px, 0)`;
        }
      }

      // Vision (L2)
      const vIn = seg(sp, 0.16, 0.27);
      const vOut = seg(sp, 0.34, 0.42);
      if (layerL2Ref.current) {
        if (vIn <= 0 || vOut >= 1) {
          layerL2Ref.current.style.visibility = "hidden";
        } else {
          layerL2Ref.current.style.visibility = "visible";
          if (visionRef.current) {
            const words = visionRef.current.querySelectorAll<HTMLElement>(".word");
            words.forEach((w) => {
              const idx = parseInt(w.getAttribute("data-idx") || "0", 10);
              const k = clamp(vIn * 1.6 - idx * 0.08);
              const ty = (1 - k) * 30 - vOut * 60;
              const blur = (1 - k) * 12 + vOut * 14;
              const op = k * (1 - vOut);
              w.style.transform = `translate3d(0, ${ty}px, 0)`;
              w.style.filter = `blur(${blur}px)`;
              w.style.opacity = `${op}`;
            });

            const chipAndP = clamp(vIn * 2 - 0.6) * (1 - vOut);
            const chipLift = -vOut * 50;
            const chip = visionRef.current.querySelector<HTMLElement>(".chip");
            const p = visionRef.current.querySelector<HTMLElement>("p");
            if (chip) {
              chip.style.opacity = `${chipAndP}`;
              chip.style.transform = `translateY(${chipLift}px)`;
            }
            if (p) {
              p.style.opacity = `${chipAndP}`;
              p.style.transform = `translateY(${chipLift}px)`;
            }
          }
        }
      }

      // Accounting & Hotspots (L3)
      const aIn = seg(sp, 0.45, 0.55);
      const aOut = seg(sp, 0.63, 0.68);
      if (layerL3Ref.current) {
        if (aIn <= 0 || aOut >= 1) {
          layerL3Ref.current.style.visibility = "hidden";
        } else {
          layerL3Ref.current.style.visibility = "visible";
          if (acctParaRef.current) {
            const acctWords = acctParaRef.current.querySelectorAll<HTMLElement>(".word");
            const count = acctWords.length;
            acctWords.forEach((w, i) => {
              const k = clamp(aIn * 2.2 - (i / count) * 1.2);
              w.style.opacity = `${(0.15 + 0.85 * k) * (1 - aOut)}`;
              w.style.filter = `blur(${(1 - k) * 6 + aOut * 10}px)`;
            });
          }

          const hotspots = layerL3Ref.current.querySelectorAll<HTMLElement>(".hotspot");
          hotspots.forEach((hs, i) => {
            const hk = seg(sp, 0.49 + i * 0.02, 0.53 + i * 0.02);
            if (hk <= 0) {
              hs.style.visibility = "hidden";
            } else {
              hs.style.visibility = "visible";
              const hScale = hk * (1 - aOut);
              hs.style.transform = `translate3d(${sx * -30}px, ${sy * -20}px, 0) scale(${hScale})`;
            }
          });
        }
      }

      // Station Telemetry (L4)
      const sIn = seg(sp, 0.72, 0.82);
      if (layerL4Ref.current) {
        if (sIn <= 0) {
          layerL4Ref.current.style.visibility = "hidden";
        } else {
          layerL4Ref.current.style.visibility = "visible";

          // Heading
          if (credRef.current) {
            credRef.current.style.opacity = `${sIn}`;
            credRef.current.style.transform = `translateY(${(1 - sIn) * 30}px)`;
            credRef.current.style.filter = `blur(${(1 - sIn) * 8}px)`;
          }

          // Card
          const cIn = ease(seg(sp, 0.74, 0.86));
          if (gaugeCardRef.current) {
            gaugeCardRef.current.style.opacity = `${cIn}`;
            const cardTy = (1 - cIn) * 60 + sy * -10;
            gaugeCardRef.current.style.transform = `translate3d(${sx * -14}px, ${cardTy}px, 0) rotateY(${sx * 8}deg) rotateX(${-sy * 8}deg)`;
          }

          // Gauge Counter (48.00 -> 49.82 m)
          const pCount = seg(sp, 0.76, 0.9);
          if (stageCounterRef.current) {
            const currentStage = (48.0 + 1.82 * pCount).toFixed(2);
            stageCounterRef.current.innerText = currentStage;
          }

          // Sparkline Dashoffset
          const pSpark = seg(sp, 0.77, 0.92);
          if (sparkPolyRef.current) {
            sparkPolyRef.current.style.strokeDashoffset = `${sparkLen * (1 - pSpark)}`;
          }

          // Feature Rows
          if (featsRef.current) {
            const featRows = featsRef.current.querySelectorAll<HTMLElement>(".feat-row");
            featRows.forEach((row, i) => {
              const rk = ease(seg(sp, 0.76 + i * 0.025, 0.82 + i * 0.025));
              row.style.opacity = `${rk}`;
              row.style.transform = `translateX(${(1 - rk) * 40}px)`;
            });
          }
        }
      }

      // Check stats visibility
      triggerStats();

      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("resize", layoutHero);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div className="relative w-full bg-[#1e1e1c] text-[#FFFFFF]">
      {/* 5-Beat Pinned Story Section */}
      <section ref={containerRef} id="story" className="relative h-[640vh] w-full">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#dfe3e0] text-[#0d141b]">
          {/* Camera Box */}
          <div
            ref={camMainRef}
            className="absolute inset-[-9%_-3%_-3%_-3%] pointer-events-none will-change-transform"
          >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover block" />
            <img
              ref={plateRef}
              src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261106_031618_8ce6dca1-972d-429d-8d13-bf0691c37848.png&w=2400&q=88"
              alt="Ganga Basin Topographic Twin"
              className="absolute inset-0 w-full h-full object-cover block z-[2]"
            />
            {/* Ambient Mist Drift */}
            <div
              className="absolute inset-[-10%] pointer-events-none z-[3]"
              style={{
                background:
                  "radial-gradient(40% 30% at 20% 80%, rgba(255,255,255,0.55) 0%, transparent 70%), radial-gradient(35% 25% at 85% 30%, rgba(255,255,255,0.4) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Hidden Video for Canvas Frame Scrubbing */}
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261106_025717_906b686d-9a9a-4dea-bab4-ae2454f8390e.mp4"
            className="absolute w-[2px] h-[2px] opacity-0 pointer-events-none"
          />

          {/* Fog Bank */}
          <div
            ref={fogRef}
            className="absolute left-[-8vw] top-[-6vh] w-[56vw] h-[60vh] z-[5] pointer-events-none invisible"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 52% 48% at 46% 46%, #000 44%, rgba(0,0,0,0.7) 64%, transparent 100%)",
              maskImage:
                "radial-gradient(ellipse 52% 48% at 46% 46%, #000 44%, rgba(0,0,0,0.7) 64%, transparent 100%)",
            }}
          >
            <div
              className="absolute inset-0 blur-[10px]"
              style={{
                background: "radial-gradient(60% 55% at 40% 45%, #d9dddd, #cfd4d4 60%, #c9cfcf)",
              }}
            />
            <div
              className="absolute inset-[-20%] opacity-55 blur-[14px]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 700 460' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.006 0.014' numOctaves='3' seed='4'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.74 0 0 0 0 0.78 0 0 0 0 0.79 1.4 0 0 0 -0.7'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
              }}
            />
            <div
              className="absolute inset-[-20%] opacity-90 blur-[8px]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 700 460' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.004 0.009' numOctaves='4' seed='11'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.90 0 0 0 0 0.92 0 0 0 0 0.92 1.6 0 0 0 -0.55'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter2)'/%3E%3C/svg%3E\")",
              }}
            />
          </div>

          {/* Layer L0: Hero Headline */}
          <div ref={layerL0Ref} className="absolute inset-0 pointer-events-none z-[4]">
            <div ref={heroCopyRef} className="absolute left-0 right-0 text-center pointer-events-none">
              <div className="inline-flex items-center justify-center h-[22px] px-[9px] bg-emerald-600 text-white rounded-[3px] font-sans text-[11px] tracking-wider uppercase font-semibold shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
                BASIN TELEMETRY
              </div>
              <h1 className="mt-[18px] font-heading text-[clamp(44px,5.8vw,98px)] font-bold leading-[0.92] tracking-[-0.045em] text-[#0d141b]">
                <span className="line-wrap block overflow-hidden pb-[0.08em] whitespace-nowrap">
                  <span className="inline-block transform-none">Forecast the Living Basin</span>
                </span>
              </h1>
            </div>
          </div>

          {/* Front Cut-Out Mask (occluding bottom of letters) */}
          <div
            ref={camFrontRef}
            className="absolute inset-[-9%_-3%_-3%_-3%] pointer-events-none z-[6] invisible"
            style={{
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 25%, #000 27.5%, #000 71.5%, transparent 74%)",
              maskImage:
                "linear-gradient(90deg, transparent 25%, #000 27.5%, #000 71.5%, transparent 74%)",
            }}
          >
            <img
              src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261106_031657_baaa3380-5ece-482a-a623-a1838fd7653c.png&w=2400&q=90"
              alt="Ganga Basin Front Cutout"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Floating Rock Sprites */}
          <div
            ref={rk1Ref}
            data-x="-0.3"
            data-y="-0.6"
            data-d="1.3"
            className="absolute left-[4%] top-[13%] w-[7.5vw] aspect-[260/295] overflow-hidden pointer-events-none z-[7] will-change-transform"
          >
            <div className="absolute inset-0 animate-[bob_6s_ease-in-out_infinite_alternate]">
              <img
                src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261106_025635_82593f6a-1cf7-41c1-94ac-96fb89ebfd1a.png&w=2400&q=85"
                alt="Catchment Terrain Fragment"
                className="absolute max-w-none w-[calc(1200/260*100%)] left-[calc(-30/260*100%)] top-[calc(-200/295*100%)]"
              />
            </div>
          </div>

          <div
            ref={rk3Ref}
            data-x="1.0"
            data-y="0.55"
            data-d="1.8"
            className="absolute left-[80%] top-[58%] w-[14vw] aspect-[265/270] overflow-hidden pointer-events-none z-[7] will-change-transform"
          >
            <div className="absolute inset-0 animate-[bob_8.5s_ease-in-out_-3s_infinite_alternate]">
              <img
                src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261106_025635_82593f6a-1cf7-41c1-94ac-96fb89ebfd1a.png&w=2400&q=85"
                alt="Catchment Terrain Fragment"
                className="absolute max-w-none w-[calc(1200/265*100%)] left-[calc(-895/265*100%)] top-[calc(-240/270*100%)]"
              />
            </div>
          </div>

          {/* Layer L1: HUD, Caption, Hint */}
          <div ref={layerL1Ref} className="absolute inset-0 pointer-events-none z-[8]">
            {/* GPS Telemetry HUD */}
            <div
              ref={hudRef}
              className="absolute left-[53.5%] top-[62%] pointer-events-auto transform-none"
            >
              {/* Crosshair */}
              <div className="absolute -left-[44px] top-[4px] w-[22px] h-[22px]">
                <div className="absolute left-0 top-[10px] w-[22px] h-[1px] bg-white/90" />
                <div className="absolute top-0 left-[10px] w-[1px] h-[22px] bg-white/90" />
              </div>
              <div className="inline-flex items-center justify-center h-[20px] px-[8px] bg-emerald-600 text-white rounded-[3px] font-sans text-[10px] tracking-wider uppercase font-semibold">
                STN-PAT-01
              </div>
              <pre className="font-mono text-[11px] tracking-[0.12em] leading-[1.65] text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] mt-[10px]">
{`LAT  25.6122° N
LON  85.1584° E
ELEV 49.82 M`}
              </pre>
              <div
                className="absolute -top-[8px] -left-[8px] -right-[14px] -bottom-[10px] border border-white/55 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 14px 0%, 14px 1px, 1px 1px, 1px 14px, 0% 14px,
                    100% 0%, 100% 14px, calc(100% - 1px) 14px, calc(100% - 1px) 1px, calc(100% - 14px) 1px, calc(100% - 14px) 0%,
                    100% 100%, calc(100% - 14px) 100%, calc(100% - 14px) calc(100% - 1px), calc(100% - 1px) calc(100% - 1px), calc(100% - 1px) calc(100% - 14px), 100% calc(100% - 14px),
                    0% 100%, 0% calc(100% - 14px), 1px calc(100% - 14px), 1px calc(100% - 1px), 14px calc(100% - 1px), 14px 100%
                  )`,
                }}
              />
            </div>

            {/* Bottom-left Caption */}
            <div
              ref={captionRef}
              className="absolute left-[34px] bottom-[34px] pl-[16px] border-l-2 border-[#FFFFFF] font-sans text-xs leading-relaxed uppercase tracking-wider text-[#223040]"
            >
              Real-time Ganga basin telemetry.
              <br />
              Powered by hydrodynamic physics,
              <br />
              Sentinel-1 SAR, and verified CAP advisories.
            </div>

            {/* Bottom-right Scroll Hint */}
            <div
              ref={scrollHintRef}
              className="absolute right-[34px] bottom-[36px] flex items-center gap-[12px] font-sans text-xs tracking-wider text-[#223040]"
            >
              <div className="w-[20px] h-[20px] rounded-full border-[1.3px] border-current flex items-center justify-center">
                <span className="block w-[4px] h-[4px] border-r-[1.2px] border-b-[1.2px] border-current rotate-45 translate-y-[1px]" />
              </div>
              <span>SCROLL TO EXPLORE</span>
            </div>
          </div>

          {/* Layer L2: Vision Statement */}
          <div ref={layerL2Ref} className="absolute inset-0 pointer-events-none z-[8] invisible">
            <div
              ref={visionRef}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(820px,90vw)] text-center text-white pointer-events-auto"
            >
              <div className="chip inline-flex items-center justify-center h-[22px] px-[9px] bg-emerald-600 text-white rounded-[3px] font-sans text-[11px] tracking-wider uppercase font-semibold">
                OPERATIONAL MANDATE
              </div>
              <h2 className="font-heading text-[clamp(34px,4.6vw,70px)] font-bold leading-none tracking-[-0.04em] my-[18px] text-white [text-shadow:0_2px_40px_rgba(10,30,15,0.65),0_1px_3px_rgba(10,30,15,0.4)]">
                <span className="word inline-block mr-2" data-idx="0">From</span>
                <span className="word inline-block mr-2" data-idx="1">River</span>
                <span className="word inline-block mr-2" data-idx="2">Surge</span>
                <span className="word inline-block mr-2" data-idx="3">to</span>
                <br />
                <span className="word inline-block mr-2" data-idx="4">Physics-Backed,</span>
                <br />
                <span className="word inline-block mr-2" data-idx="5">Actionable</span>
                <span className="word inline-block" data-idx="6">Defense</span>
              </h2>
              <p className="text-[16px] leading-[1.45] text-white/95 [text-shadow:0_1px_14px_rgba(10,30,15,0.7)]">
                A breakthrough in catchment hydrodynamic forecasting,
                <br />
                engineered for civil disaster protection.
              </p>
            </div>
          </div>

          {/* Layer L3: Accounting & Hotspots */}
          <div ref={layerL3Ref} className="absolute inset-0 pointer-events-none z-[8] invisible">
            <p
              ref={acctParaRef}
              className="absolute left-[34px] top-[14vh] w-[min(560px,86vw)] text-[clamp(20px,1.9vw,29px)] leading-[1.16] tracking-[-0.02em] text-[#0d141b] [text-shadow:0_0_24px_rgba(255,255,255,0.85)] pointer-events-auto"
            >
              {[
                "Our", "basin-scale", "hydrodynamic", "modeling", "translates", "complex",
                "catchment", "rainfall", "into", "verifiable,", "compliance-ready", "flood",
                "metrics", "—", "so", "civil", "authorities", "can", "deploy", "targeted",
                "evacuations,", "not", "generic", "warnings."
              ].map((w, i) => (
                <span key={i} className="word inline-block mr-1.5" data-idx={i}>
                  {w}
                </span>
              ))}
            </p>

            {/* Hotspot 1 */}
            <div
              className={`hotspot absolute left-[12%] top-[58%] z-[9] flex items-center gap-[10px] cursor-pointer select-none pointer-events-auto transition-transform ${
                activeHotspot === 1 ? "on" : ""
              }`}
              onClick={() => setActiveHotspot(activeHotspot === 1 ? null : 1)}
            >
              <div className="hs-dot w-[22px] h-[22px] rounded-full bg-[#FFFFFF] relative flex items-center justify-center shadow-md">
                <div className="w-[10px] h-[1.4px] bg-white" />
                <div className="absolute w-[1.4px] h-[10px] bg-white" />
              </div>
              <div className="hs-pill font-sans text-[11px] font-semibold tracking-wider uppercase text-[#0d141b] px-[9px] py-[6px] rounded-[4px] bg-[#ffffff] border border-[#d8cbb3]/40 flex flex-col gap-[2px] shadow-sm">
                <span>River Stage</span>
                <em
                  className={`not-italic text-[#FFFFFF] font-semibold overflow-hidden transition-all duration-300 ${
                    activeHotspot === 1 ? "max-h-[20px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  49.82 m (Normal)
                </em>
              </div>
            </div>

            {/* Hotspot 2 */}
            <div
              className={`hotspot absolute left-[33%] top-[41%] z-[9] flex items-center gap-[10px] cursor-pointer select-none pointer-events-auto transition-transform ${
                activeHotspot === 2 ? "on" : ""
              }`}
              onClick={() => setActiveHotspot(activeHotspot === 2 ? null : 2)}
            >
              <div className="hs-dot w-[22px] h-[22px] rounded-full bg-[#FFFFFF] relative flex items-center justify-center shadow-md">
                <div className="w-[10px] h-[1.4px] bg-white" />
                <div className="absolute w-[1.4px] h-[10px] bg-white" />
              </div>
              <div className="hs-pill font-sans text-[11px] font-semibold tracking-wider uppercase text-[#0d141b] px-[9px] py-[6px] rounded-[4px] bg-[#ffffff] border border-[#d8cbb3]/40 flex flex-col gap-[2px] shadow-sm">
                <span>Upstream Inflow</span>
                <em
                  className={`not-italic text-[#FFFFFF] font-semibold overflow-hidden transition-all duration-300 ${
                    activeHotspot === 2 ? "max-h-[20px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  28,400 m³/s
                </em>
              </div>
            </div>

            {/* Hotspot 3 */}
            <div
              className={`hotspot absolute left-[70%] top-[66%] z-[9] flex items-center gap-[10px] cursor-pointer select-none pointer-events-auto transition-transform ${
                activeHotspot === 3 ? "on" : ""
              }`}
              onClick={() => setActiveHotspot(activeHotspot === 3 ? null : 3)}
            >
              <div className="hs-dot w-[22px] h-[22px] rounded-full bg-[#FFFFFF] relative flex items-center justify-center shadow-md">
                <div className="w-[10px] h-[1.4px] bg-white" />
                <div className="absolute w-[1.4px] h-[10px] bg-white" />
              </div>
              <div className="hs-pill font-sans text-[11px] font-semibold tracking-wider uppercase text-[#0d141b] px-[9px] py-[6px] rounded-[4px] bg-[#ffffff] border border-[#d8cbb3]/40 flex flex-col gap-[2px] shadow-sm">
                <span>Soil Saturation</span>
                <em
                  className={`not-italic text-[#FFFFFF] font-semibold overflow-hidden transition-all duration-300 ${
                    activeHotspot === 3 ? "max-h-[20px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  84.2 % API
                </em>
              </div>
            </div>

            {/* Hotspot 4 */}
            <div
              className={`hotspot absolute left-[83%] top-[47%] z-[9] flex items-center gap-[10px] cursor-pointer select-none pointer-events-auto transition-transform ${
                activeHotspot === 4 ? "on" : ""
              }`}
              onClick={() => setActiveHotspot(activeHotspot === 4 ? null : 4)}
            >
              <div className="hs-dot w-[22px] h-[22px] rounded-full bg-[#FFFFFF] relative flex items-center justify-center shadow-md">
                <div className="w-[10px] h-[1.4px] bg-white" />
                <div className="absolute w-[1.4px] h-[10px] bg-white" />
              </div>
              <div className="hs-pill font-sans text-[11px] font-semibold tracking-wider uppercase text-[#0d141b] px-[9px] py-[6px] rounded-[4px] bg-[#ffffff] border border-[#d8cbb3]/40 flex flex-col gap-[2px] shadow-sm">
                <span>Ensemble Spread</span>
                <em
                  className={`not-italic text-[#FFFFFF] font-semibold overflow-hidden transition-all duration-300 ${
                    activeHotspot === 4 ? "max-h-[20px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  ±0.18 m (90% CI)
                </em>
              </div>
            </div>
          </div>

          {/* Layer L4: Station Telemetry */}
          <div ref={layerL4Ref} className="absolute inset-0 pointer-events-none z-[8] invisible">
            {/* Station Heading */}
            <div ref={credRef} className="absolute left-[34px] top-[13vh] max-w-[400px] pointer-events-auto">
              <div className="inline-flex items-center font-sans text-[11px] tracking-wider uppercase font-semibold px-[8px] py-[4px] rounded-[3px] bg-emerald-600 text-white mb-[12px]">
                ✕ GAUGE STATION 01 · PATNA GANDHI GHAT
              </div>
              <h3 className="font-heading text-[clamp(22px,2vw,30px)] font-bold leading-[1.08] tracking-[-0.025em] text-[#0d141b] [text-shadow:0_0_24px_rgba(255,255,255,0.9)]">
                Scientific credibility for basin-wide flood defence
              </h3>
            </div>

            {/* Gauge Telemetry Solid Card */}
            <div
              ref={gaugeCardRef}
              className="absolute left-[38%] top-[38vh] w-[260px] p-[18px] rounded-[10px] bg-[#14202c] border border-white/20 text-white z-[8] pointer-events-auto shadow-2xl"
            >
              <h4 className="text-[15px] font-semibold leading-[1.2]">
                River stage elevation
                <br />
                Patna Gandhi Ghat
              </h4>
              <div className="font-sans text-[10px] text-[#A69B88] font-medium mt-[4px] uppercase tracking-wider">
                Station STN-PAT-01 · 15-min Telemetry
              </div>

              <div className="flex items-baseline gap-[6px] my-[12px]">
                <span ref={stageCounterRef} className="font-mono text-[46px] font-semibold tracking-[-0.04em] leading-none">
                  49.82
                </span>
                <span className="font-mono text-[10px] tracking-wider text-[#A69B88]">METERS</span>
              </div>

              <div className="absolute right-[16px] top-[96px] bg-emerald-600 text-white font-sans text-[10px] tracking-wider px-[7px] py-[3px] rounded-[3px] font-semibold">
                +1.68 m SURGE
              </div>

              <svg className="w-[220px] h-[70px] block my-[10px] overflow-visible" viewBox="0 0 220 70">
                <polyline
                  ref={sparkPolyRef}
                  className="fill-none stroke-[#5286ff] stroke-[1.8] stroke-round stroke-linejoin-round"
                  points="0,60 30,55 60,57 90,44 120,46 150,30 180,24 214,10"
                />
                <circle cx="90" cy="44" r="2.4" fill="#ffffff" />
                <circle cx="150" cy="30" r="2.4" fill="#ffffff" />
                <circle cx="214" cy="10" r="3.4" fill="#FFFFFF" />
              </svg>

              <div className="font-mono text-[9.5px] tracking-wider text-[#A69B88] mt-[6px] uppercase">
                T-6H · T-0 · T+12H · T+24H
              </div>
            </div>

            {/* Feature Checklist List */}
            <div
              ref={featsRef}
              className="absolute right-[34px] top-[30vh] w-[min(400px,36vw)] px-[16px] py-[6px] rounded-[10px] bg-[#ffffff] border border-[#d8cbb3]/40 text-[#0d141b] z-[8] pointer-events-auto shadow-md"
            >
              {[
                { idx: "01", lbl: "Automated CWC telemetry ingestion" },
                { idx: "02", lbl: "1D/2D coupled hydrodynamic modeling" },
                { idx: "03", lbl: "Sentinel-1 SAR inundation radar" },
                { idx: "04", lbl: "OASIS CAP v1.2 cryptographic alerts" },
                { idx: "05", lbl: "Integrated citizen SOS rescue queue" },
              ].map((row, i) => (
                <div
                  key={row.idx}
                  className={`feat-row grid grid-cols-[30px_1fr_16px] gap-[8px] items-center py-[11px] font-mono text-[11px] tracking-[0.12em] uppercase cursor-pointer border-b border-[#10291a]/15 last:border-b-0 transition-all ${
                    activeFeat === i ? "text-[#FFFFFF] pl-[6px]" : "hover:text-[#FFFFFF] hover:pl-[6px]"
                  }`}
                  onClick={() => setActiveFeat(activeFeat === i ? null : i)}
                >
                  <span className="opacity-60">{row.idx}</span>
                  <span className="font-sans font-medium text-[11.5px] normal-case">{row.lbl}</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-[22px] left-1/2 -translate-x-1/2 w-[120px] h-[2px] bg-[#10291a]/20 rounded-[2px] overflow-hidden z-[10]">
            <div
              ref={progBarRef}
              className="w-full h-full bg-[#FFFFFF] origin-left scale-x-0 will-change-transform"
            />
          </div>
        </div>
      </section>

      {/* 5. Solutions & Core Operations Section */}
      <section
        id="sol"
        className="relative z-20 -mt-[30vh] bg-[#1e1e1c] text-[#FFFFFF] rounded-t-[22px] px-[34px] pt-[70px] pb-[90px] shadow-[0_-30px_60px_rgba(0,0,0,0.5)] border-t border-[#d8cbb3]/15 max-w-[1340px] mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div className="max-w-[640px]">
            <div className="inline-flex items-center justify-center h-[22px] px-[9px] bg-emerald-600 text-white rounded-[3px] font-sans text-[11px] tracking-wider uppercase font-semibold mb-4">
              OPERATIONAL CAPABILITIES
            </div>
            <h2 className="font-heading text-[clamp(32px,3.9vw,54px)] font-bold leading-tight tracking-[-0.03em] text-[#FFFFFF]">
              Validating what the river system does under surge.
            </h2>
          </div>
          <p className="max-w-[360px] text-sm text-[#a69b88] leading-relaxed">
            Field sensors, hydrodynamic flood-routing models, and satellite SAR fused into one auditable record — so every evacuation order can be traced back to verifiable physical science.
          </p>
        </div>

        {/* 3 Tilting Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-10">
          {/* Card 1 */}
          <div
            className="group relative h-[440px] rounded-[12px] overflow-hidden bg-[#0A0A0A] text-[#FFFFFF] border border-[#d8cbb3]/15 transition-all duration-300 hover:border-[#FFFFFF]/60 cursor-pointer"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "";
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage: "url('/images/hydrodynamic-river-routing.jpg')",
                backgroundPosition: "center center",
                backgroundSize: "cover",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e141a]/60 via-transparent to-[#0e141a]/90" />
            <div className="absolute top-[18px] left-[18px] right-[18px] flex justify-between items-center z-10">
              <span className="font-sans text-[11px] tracking-wider uppercase font-semibold text-[#FFFFFF]/90">
                [Hydrological Forecasting]
              </span>
              <div className="w-[28px] h-[28px] rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs transition-transform duration-300 group-hover:-rotate-45">
                →
              </div>
            </div>
            <div className="absolute bottom-[22px] left-[20px] right-[20px] z-10">
              <h3 className="font-heading text-[23px] font-bold tracking-tight text-white leading-tight">
                Hydrodynamic river routing & ensemble spread
              </h3>
              <p className="text-[13.5px] leading-relaxed text-[#d8cbb3] max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-[90px] group-hover:opacity-100 group-hover:mt-2.5">
                Continuous hydraulic physics replace static warning tables, giving commanders 48-hour advance visibility on crest heights.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div
            className="group relative h-[440px] rounded-[12px] overflow-hidden bg-[#0A0A0A] text-[#FFFFFF] border border-[#d8cbb3]/15 transition-all duration-300 hover:border-[#FFFFFF]/60 cursor-pointer"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "";
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage: "url('/images/sentinel1-sar-inundation.jpg')",
                backgroundPosition: "center center",
                backgroundSize: "cover",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e141a]/60 via-transparent to-[#0e141a]/90" />
            <div className="absolute top-[18px] left-[18px] right-[18px] flex justify-between items-center z-10">
              <span className="font-sans text-[11px] tracking-wider uppercase font-semibold text-[#FFFFFF]/90">
                [Satellite Mapping]
              </span>
              <div className="w-[28px] h-[28px] rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs transition-transform duration-300 group-hover:-rotate-45">
                →
              </div>
            </div>
            <div className="absolute bottom-[22px] left-[20px] right-[20px] z-10">
              <h3 className="font-heading text-[23px] font-bold tracking-tight text-white leading-tight">
                Sentinel-1 SAR inundation radar
              </h3>
              <p className="text-[13.5px] leading-relaxed text-[#d8cbb3] max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-[90px] group-hover:opacity-100 group-hover:mt-2.5">
                Cloud-penetrating radar confirms active floodplain inundation extents, resolving water boundaries through monsoon storm covers.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div
            className="group relative h-[440px] rounded-[12px] overflow-hidden bg-[#0A0A0A] text-[#FFFFFF] border border-[#d8cbb3]/15 transition-all duration-300 hover:border-[#FFFFFF]/60 cursor-pointer"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "";
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261106_025630_9a37a1e0-2547-4973-8160-c75205993914.png&w=1400&q=82')",
                backgroundPosition: "62% 30%",
                backgroundSize: "230%",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e141a]/60 via-transparent to-[#0e141a]/90" />
            <div className="absolute top-[18px] left-[18px] right-[18px] flex justify-between items-center z-10">
              <span className="font-sans text-[11px] tracking-wider uppercase font-semibold text-[#FFFFFF]/90">
                [Emergency Governance]
              </span>
              <div className="w-[28px] h-[28px] rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs transition-transform duration-300 group-hover:-rotate-45">
                →
              </div>
            </div>
            <div className="absolute bottom-[22px] left-[20px] right-[20px] z-10">
              <h3 className="font-heading text-[23px] font-bold tracking-tight text-white leading-tight">
                CAP v1.2 alerts & human-in-the-loop
              </h3>
              <p className="text-[13.5px] leading-relaxed text-[#d8cbb3] max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-[90px] group-hover:opacity-100 group-hover:mt-2.5">
                Automated physics checkpoints verify telemetry integrity before commanders authorize cryptographic multi-channel broadcasts.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Animated Counting Stats */}
        <div
          ref={statsGridRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 mt-12 border-t border-[#d8cbb3]/15"
        >
          <div className="space-y-1">
            <div className="stat-val font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#FFFFFF]" data-val="14" data-type="int">
              14
            </div>
            <div className="font-sans text-[11px] tracking-wider uppercase font-medium text-[#a69b88]">
              Basin Gauges Active
            </div>
          </div>

          <div className="space-y-1">
            <div className="stat-val font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#FFFFFF]" data-val="48" data-suffix="h" data-type="int">
              48h
            </div>
            <div className="font-sans text-[11px] tracking-wider uppercase font-medium text-[#a69b88]">
              Forecast Lead Time
            </div>
          </div>

          <div className="space-y-1">
            <div className="stat-val font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#FFFFFF]" data-val="90" data-suffix="%" data-type="int">
              90%
            </div>
            <div className="font-sans text-[11px] tracking-wider uppercase font-medium text-[#a69b88]">
              Confidence Interval
            </div>
          </div>

          <div className="space-y-1">
            <div className="stat-val font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#FFFFFF]" data-val="99.8" data-suffix="%" data-type="float">
              99.8%
            </div>
            <div className="font-sans text-[11px] tracking-wider uppercase font-medium text-[#a69b88]">
              Telemetry Stream Uptime
            </div>
          </div>
        </div>

        {/* Quick Launch Link Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-12 pt-8 border-t border-[#d8cbb3]/10 text-xs">
          <div className="flex items-center gap-4 text-[#a69b88]">
            <span>Middle Ganga Basin Study Corridor</span>
            <span className="font-mono text-[#FFFFFF]">STN-PAT-01 (Gandhi Ghat)</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-semibold text-[#FFFFFF] hover:underline flex items-center gap-1"
            >
              Access Operations Command Centre <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
