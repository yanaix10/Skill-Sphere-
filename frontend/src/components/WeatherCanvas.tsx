import React, { useEffect, useRef } from "react";
import { WeatherState } from "./useDynamicEnvironment";

interface WeatherCanvasProps {
  weatherState: WeatherState;
  className?: string;
}

interface RainParticle {
  x: number;
  y: number;
  length: number;
  speed: number;
  dx: number;
  opacity: number;
}

interface SnowParticle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  driftSpeed: number;
  amplitude: number;
  opacity: number;
}

interface FogParticle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  opacity: number;
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({
  weatherState,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
      initParticles();
    };

    window.addEventListener("resize", handleResize);

    // Particle storage
    let rainParticles: RainParticle[] = [];
    let snowParticles: SnowParticle[] = [];
    let fogParticles: FogParticle[] = [];

    const initParticles = () => {
      if (weatherState === "rain") {
        const count = Math.floor((width * height) / 9000); // ~120 on full HD
        rainParticles = Array.from({ length: Math.max(80, count) }, () => ({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * height,
          length: 18 + Math.random() * 22,
          speed: 15 + Math.random() * 10,
          dx: -2.5 - Math.random() * 1.5,
          opacity: 0.35 + Math.random() * 0.35,
        }));
      } else if (weatherState === "snow") {
        const count = Math.floor((width * height) / 12000); // ~80 on full HD
        snowParticles = Array.from({ length: Math.max(50, count) }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1.5 + Math.random() * 3,
          speed: 0.8 + Math.random() * 1.4,
          angle: Math.random() * Math.PI * 2,
          driftSpeed: 0.015 + Math.random() * 0.02,
          amplitude: 1.2 + Math.random() * 1.8,
          opacity: 0.4 + Math.random() * 0.5,
        }));
      } else if (weatherState === "clouds/wind") {
        // Large fog puffs located across the bottom third of the canvas
        const count = 14;
        fogParticles = Array.from({ length: count }, () => {
          const radius = 140 + Math.random() * 160;
          return {
            x: Math.random() * (width + radius * 2) - radius,
            // Bottom third distribution
            y: height * 0.65 + Math.random() * (height * 0.35),
            radius,
            vx: 0.15 + Math.random() * 0.3,
            opacity: 0.05 + Math.random() * 0.07,
          };
        });
      } else {
        rainParticles = [];
        snowParticles = [];
        fogParticles = [];
      }
    };

    initParticles();

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (weatherState === "rain") {
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = "rgba(173, 216, 230, 0.5)";

        ctx.beginPath();
        for (let i = 0; i < rainParticles.length; i++) {
          const p = rainParticles[i];
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.dx, p.y + p.length);

          p.x += p.dx;
          p.y += p.speed;

          if (p.y > height + 20) {
            p.y = -p.length;
            p.x = Math.random() * (width + 200) - 100;
          }
        }
        ctx.stroke();
      } else if (weatherState === "snow") {
        for (let i = 0; i < snowParticles.length; i++) {
          const p = snowParticles[i];

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.fill();

          p.angle += p.driftSpeed;
          p.x += Math.sin(p.angle) * p.amplitude;
          p.y += p.speed;

          if (p.y > height + 10) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }
      } else if (weatherState === "clouds/wind") {
        for (let i = 0; i < fogParticles.length; i++) {
          const p = fogParticles[i];

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${p.opacity * 0.45})`);
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.vx;
          if (p.x - p.radius > width) {
            p.x = -p.radius;
            p.y = height * 0.65 + Math.random() * (height * 0.35);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [weatherState]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
    />
  );
};

export default WeatherCanvas;

