import React, { useRef, useEffect } from "react";
import {
  PlayerStats,
  Enemy,
  Projectile,
  FloatingText,
  Particle,
  Skin,
} from "../types";
import { COLOR_PALETTE, CANVAS_SIZE } from "../constants";

interface GameCanvasProps {
  statsRef: React.MutableRefObject<PlayerStats>;
  enemies: React.MutableRefObject<Enemy[]>;
  projectiles: React.MutableRefObject<Projectile[]>;
  texts: React.MutableRefObject<FloatingText[]>;
  particles: React.MutableRefObject<Particle[]>;
  gameTimeRef: React.MutableRefObject<number>;
  shockwaveRef: React.MutableRefObject<{
    active: boolean;
    radius: number;
    hitIds: Set<number>;
  }>;
  selectedSkin: Skin;
  screenShakeRef: React.MutableRefObject<number>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  statsRef,
  enemies,
  projectiles,
  texts,
  particles,
  gameTimeRef,
  shockwaveRef,
  selectedSkin,
  screenShakeRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false }); // Optimize for no transparency on bg
    if (!ctx) return;
    // Handle devicePixelRatio to keep canvas crisp on Retina displays
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      // Set internal pixel size
      canvas.width = CANVAS_SIZE * dpr;
      canvas.height = CANVAS_SIZE * dpr;
      // CSS size stays the same
      canvas.style.width = `${CANVAS_SIZE}px`;
      canvas.style.height = `${CANVAS_SIZE}px`;
      // Normalize drawing operations to CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;

    // FPS counter
    let lastFrameTime = performance.now();
    let fpsFrameCount = 0;
    let lastFpsUpdate = lastFrameTime;
    let measuredFps = 0;

    const render = () => {
      const now = performance.now();
      const frameDelta = now - lastFrameTime;
      lastFrameTime = now;
      fpsFrameCount++;
      if (now - lastFpsUpdate >= 500) {
        measuredFps = Math.round(
          (fpsFrameCount * 1000) / (now - lastFpsUpdate)
        );
        fpsFrameCount = 0;
        lastFpsUpdate = now;
      }

      const currentStats = statsRef.current;
      const enemyCount = enemies.current.length;

      // DYNAMIC PERFORMANCE MODE
      const lowQualityMode = enemyCount > 15;
      const ultraLowQualityMode = enemyCount > 20;

      // Clear Screen
      ctx.fillStyle = COLOR_PALETTE.background;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;

      ctx.save();

      // APPLY SCREEN SHAKE
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
        screenShakeRef.current *= 0.9; // Decay
        if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
      }

      // Draw Grid (Skip in ultra low quality)
      if (!ultraLowQualityMode) {
        ctx.strokeStyle = COLOR_PALETTE.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= CANVAS_SIZE; i += 50) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, CANVAS_SIZE);
        }
        for (let i = 0; i <= CANVAS_SIZE; i += 50) {
          ctx.moveTo(0, i);
          ctx.lineTo(CANVAS_SIZE, i);
        }
        ctx.stroke();
      }

      // Draw Range Circle
      ctx.strokeStyle = `${selectedSkin.color}22`; // Low opacity skin color
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, currentStats.range, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Shockwave (EMP)
      if (shockwaveRef.current.active) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, shockwaveRef.current.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 10;
        ctx.globalAlpha = Math.max(
          0,
          1 - shockwaveRef.current.radius / (CANVAS_SIZE / 1.5)
        );
        ctx.stroke();
        ctx.restore();
      }

      // Draw Particles
      // Skip small particles in low quality mode
      particles.current.forEach((p) => {
        if (lowQualityMode && p.size < 3) return;
        ctx.save();
        ctx.fillStyle = p.color;
        if (!lowQualityMode) ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.fill();
        ctx.restore();
      });

      // BATCH RENDERING: Group enemies by color to minimize state changes
      // This is O(N) but saves expensive canvas context switches
      const enemiesByColor: Record<string, Enemy[]> = {};

      enemies.current.forEach((enemy) => {
        if (!enemiesByColor[enemy.color]) enemiesByColor[enemy.color] = [];
        enemiesByColor[enemy.color].push(enemy);
      });

      // Draw Enemies
      Object.entries(enemiesByColor).forEach(([color, enemyGroup]) => {
        ctx.fillStyle = color;
        // Shadow only if not low quality
        if (!lowQualityMode) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
        }

        ctx.beginPath();

        enemyGroup.forEach((enemy) => {
          // ULTRA LOW QUALITY: Always draw circles, ignore shapes
          if (ultraLowQualityMode) {
            ctx.moveTo(enemy.x + enemy.radius, enemy.y);
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            return;
          }

          // Standard Rendering
          if (enemy.type === "standard") {
            ctx.moveTo(enemy.x + enemy.radius, enemy.y);
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          } else if (enemy.type === "speedster") {
            // Triangle
            const angle = Math.atan2(cy - enemy.y, cx - enemy.x);
            const r = enemy.radius;
            // Manually rotate points to avoid ctx.save/restore per enemy (expensive!)
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Tip
            const tipX = enemy.x + cos * r;
            const tipY = enemy.y + sin * r;

            // Back Left
            const blX = enemy.x + Math.cos(angle + 2.5) * r;
            const blY = enemy.y + Math.sin(angle + 2.5) * r;

            // Back Right
            const brX = enemy.x + Math.cos(angle - 2.5) * r;
            const brY = enemy.y + Math.sin(angle - 2.5) * r;

            ctx.moveTo(tipX, tipY);
            ctx.lineTo(blX, blY);
            ctx.lineTo(brX, brY);
            ctx.lineTo(tipX, tipY);
          } else if (enemy.type === "tank") {
            ctx.rect(
              enemy.x - enemy.radius,
              enemy.y - enemy.radius,
              enemy.radius * 2,
              enemy.radius * 2
            );
          } else if (enemy.type === "boss") {
            ctx.moveTo(enemy.x + enemy.radius, enemy.y);
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          }
        });

        ctx.fill();

        // Reset Shadow
        if (!lowQualityMode) {
          ctx.shadowBlur = 0;
        }
      });

      // Draw HP Bars & Boss Effects (Separate Pass)
      enemies.current.forEach((enemy) => {
        // Boss Glow (Special Case)
        if (enemy.type === "boss" && !lowQualityMode) {
          ctx.save();
          ctx.shadowBlur = 30;
          ctx.shadowColor = enemy.color;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // HP Bar
        if (
          enemy.type === "boss" ||
          (!lowQualityMode && enemy.hp < enemy.maxHp)
        ) {
          const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
          const barWidth = enemy.type === "boss" ? 60 : 24;
          const barHeight = enemy.type === "boss" ? 6 : 4;
          const barX = enemy.x - barWidth / 2;
          const barY =
            enemy.y - enemy.radius - (enemy.type === "boss" ? 15 : 10);

          ctx.fillStyle = "#000";
          ctx.fillRect(barX, barY, barWidth, barHeight);

          ctx.fillStyle =
            enemy.type === "boss" ? "#a855f7" : COLOR_PALETTE.secondary;
          ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        }

        // Stun Visual
        if (enemy.stunTimer > 0 && !ultraLowQualityMode) {
          ctx.strokeStyle = "#ffff00";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2); // Simple circle for stun
          ctx.stroke();
        }
      });

      // Draw Projectiles
      projectiles.current.forEach((proj) => {
        ctx.save();
        if (!lowQualityMode) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = proj.color;
        }
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail - Disable in low quality
        if (!lowQualityMode) {
          ctx.strokeStyle = proj.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const angle = Math.atan2(proj.y - cy, proj.x - cx);
          ctx.moveTo(proj.x, proj.y);
          ctx.lineTo(
            proj.x - proj.speed * 2 * Math.cos(angle),
            proj.y - proj.speed * 2 * Math.sin(angle)
          );
          ctx.stroke();
        }
        ctx.restore();
      });

      // Draw Player (Always High Quality)
      ctx.save();
      ctx.translate(cx, cy);

      // SHIELD RING (OUTER)
      if (currentStats.maxShield > 0) {
        const shieldPct = Math.max(
          0,
          currentStats.shield / currentStats.maxShield
        );
        if (shieldPct > 0) {
          ctx.beginPath();
          ctx.arc(
            0,
            0,
            38,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * shieldPct
          );
          ctx.strokeStyle = COLOR_PALETTE.shield;
          ctx.lineWidth = 3;
          ctx.shadowColor = COLOR_PALETTE.shield;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Background ring for shield
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 243, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // HEALTH RING (INNER)
      const healthPct = Math.max(
        0,
        currentStats.health / currentStats.maxHealth
      );
      ctx.beginPath();
      ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * healthPct);
      ctx.strokeStyle = healthPct > 0.5 ? "#00ff00" : "#ff0000";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Multi-shot Orbiters
      if (currentStats.projectileCount > 1) {
        const count = Math.min(currentStats.projectileCount, 12); // Cap visuals
        const orbitRadius = 48; // Outside shield
        const time = gameTimeRef.current * 0.003;

        for (let i = 0; i < count; i++) {
          const angle = ((Math.PI * 2) / count) * i + time;
          const ox = Math.cos(angle) * orbitRadius;
          const oy = Math.sin(angle) * orbitRadius;

          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fillStyle = selectedSkin.color;
          if (!lowQualityMode) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = selectedSkin.color;
          }
          ctx.fill();
        }
        ctx.shadowBlur = 0; // reset
      }

      // PLAYER SKIN RENDERER
      ctx.rotate(gameTimeRef.current * 0.001 + currentStats.moveSpeed * 0.005);

      ctx.shadowBlur = 20;
      ctx.shadowColor = selectedSkin.color;
      ctx.fillStyle = "#050505";
      ctx.strokeStyle = selectedSkin.color;
      ctx.lineWidth = 3;

      ctx.beginPath();

      const r = 24;
      switch (selectedSkin.type) {
        case "triangle":
          for (let i = 0; i < 3; i++) {
            const angle = ((Math.PI * 2) / 3) * i - Math.PI / 2;
            const px = r * Math.cos(angle);
            const py = r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          break;
        case "square":
          ctx.rect(-r / 1.5, -r / 1.5, r * 1.3, r * 1.3);
          break;
        case "star":
          for (let i = 0; i < 5; i++) {
            const angle = ((Math.PI * 2) / 5) * i - Math.PI / 2;
            const px = r * Math.cos(angle);
            const py = r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);

            const innerAngle = angle + Math.PI / 5;
            const ix = (r / 2) * Math.cos(innerAngle);
            const iy = (r / 2) * Math.sin(innerAngle);
            ctx.lineTo(ix, iy);
          }
          break;
        case "circle":
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          break;
        case "hexagon":
        default:
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = r * Math.cos(angle);
            const py = r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          break;
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner Core
      ctx.fillStyle = selectedSkin.color;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Restore context transform (Shake + Center)

      // Draw Floating Text (No shake for UI elements usually, but here text is in world space)
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      texts.current.forEach((t) => {
        if (lowQualityMode && !t.text.includes("$") && !t.text.includes("!"))
          return;

        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life / 20); // Fade out
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });

      // Draw FPS overlay (top-left)
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(6, 6, 64, 20);
      ctx.fillStyle = "#00ffcc";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`FPS: ${measuredFps}`, 10, 20);
      ctx.restore();

      ctx.restore(); // Restore main context save

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [selectedSkin]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="max-w-full max-h-full aspect-square object-contain bg-[#080808] rounded-lg shadow-2xl border border-gray-800"
      />
    </div>
  );
};

export default React.memo(GameCanvas);
