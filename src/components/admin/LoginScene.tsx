"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; hue: number;
}

export default function LoginScene({
  focused = false,
  submitting = false,
}: {
  focused?: boolean;
  submitting?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }

    function initParticles() {
      const count = Math.min(120, Math.floor((w * h) / 12000));
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.5,
        hue: 220 + Math.random() * 80,
      }));
    }

    function draw() {
      timeRef.current += 0.005;
      const speed = submitting ? 2.5 : focused ? 1.2 : 0.6;
      ctx!.clearRect(0, 0, w, h);

      // subtle animated gradient background
      const gx = Math.sin(timeRef.current * 0.3) * 0.3 + 0.5;
      const gy = Math.cos(timeRef.current * 0.2) * 0.3 + 0.5;
      const grad = ctx!.createRadialGradient(w * gx, h * gy, 0, w * gx, h * gy, Math.max(w, h) * 0.7);
      grad.addColorStop(0, "#1a0a2e");
      grad.addColorStop(0.5, "#0f0a1e");
      grad.addColorStop(1, "#07070f");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      // grid lines with wave
      ctx!.strokeStyle = "rgba(255,255,255,0.015)";
      ctx!.lineWidth = 1;
      const gridSize = 50;
      const waveAmp = 6;
      const waveFreq = 0.008;
      for (let x = 0; x < w; x += gridSize) {
        ctx!.beginPath();
        for (let y = 0; y < h; y += 4) {
          const dx = Math.sin(y * waveFreq + timeRef.current * 2) * waveAmp;
          const dy = Math.sin(x * waveFreq * 0.5 + timeRef.current * 1.5) * waveAmp * 0.5;
          ctx!.lineTo(x + dx, y + dy);
        }
        ctx!.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx!.beginPath();
        for (let x = 0; x < w; x += 4) {
          const dx = Math.sin(y * waveFreq * 0.5 + timeRef.current * 1.5) * waveAmp;
          const dy = Math.sin(x * waveFreq + timeRef.current * 2) * waveAmp * 0.5;
          ctx!.lineTo(x + dx, y + dy);
        }
        ctx!.stroke();
      }

      // particles
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      for (const p of particlesRef.current) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // mouse repulsion
        if (mx > 0 && my > 0) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150 * 1.2;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue + Math.sin(timeRef.current + p.x * 0.01) * 20}, 70%, 60%, ${p.alpha})`;
        ctx!.fill();
      }

      // connections near particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = dx * dx + dy * dy;
          if (dist < 12000) {
            const alpha = (1 - dist / 12000) * 0.15;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `rgba(150, 100, 200, ${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    function onMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    function onTouch(e: TouchEvent) {
      const t = e.touches[0];
      if (t) mouseRef.current = { x: t.clientX, y: t.clientY };
    }

    resize();
    initParticles();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [focused, submitting]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
    />
  );
}
