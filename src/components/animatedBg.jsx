"use client";

import { useEffect, useState } from "react";

export default function AnimatedBackground() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Create initial particles
    const initialParticles = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < 50; i++) {
      initialParticles.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    setParticles(initialParticles);

    // Animate particles
    const animateParticles = () => {
      setParticles((prevParticles) =>
        prevParticles.map((particle) => {
          const newX = particle.x + particle.speedX;
          const newY = particle.y + particle.speedY;
          return {
            ...particle,
            x:
              newX > window.innerWidth
                ? 0
                : newX < 0
                ? window.innerWidth
                : newX,
            y:
              newY > window.innerHeight
                ? 0
                : newY < 0
                ? window.innerHeight
                : newY,
          };
        })
      );
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-[#111] animate-pulse"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            filter: "blur(0.5px)",
          }}
        />
      ))}

      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full animate-float"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full animate-float-delayed"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full animate-float-slow"></div>

    </div>
  );
}
