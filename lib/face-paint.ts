import { faceSeed, shade } from "./portrait";


function hexRgb(hex: string): [number, number, number] {
  if (!hex) hex = "#000000";
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function css(hex: string, a = 1): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** FC Mobile / eFootball hissi: stüdyo ışığı, cilt hacmi, kumaş forma. */
export function paintPlayerCard(canvas: HTMLCanvasElement, id: string, kit?: string) {
  const w = 360;
  const h = 504;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const f = faceSeed(id);
  const shirt = kit ?? f.shirt;
  const skin = f.skin;
  const skinDeep = shade(skin, -38);
  const skinLit = shade(skin, 28);
  const hair = f.hair;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1c2838");
  sky.addColorStop(0.45, "#101820");
  sky.addColorStop(1, "#07090c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const spot = ctx.createRadialGradient(120, 70, 10, 140, 120, 280);
  spot.addColorStop(0, "rgba(255,236,200,0.28)");
  spot.addColorStop(0.45, "rgba(255,220,160,0.06)");
  spot.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(180, 470, 130, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  const kitGrad = ctx.createLinearGradient(80, 300, 280, 504);
  kitGrad.addColorStop(0, shade(shirt, 40));
  kitGrad.addColorStop(0.45, shirt);
  kitGrad.addColorStop(1, shade(shirt, -48));
  ctx.fillStyle = kitGrad;
  ctx.beginPath();
  ctx.moveTo(72, 340);
  ctx.quadraticCurveTo(70, 300, 118, 292);
  ctx.quadraticCurveTo(180, 278, 242, 292);
  ctx.quadraticCurveTo(290, 300, 288, 340);
  ctx.lineTo(318, 504);
  ctx.lineTo(42, 504);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = shade(shirt, -28);
  ctx.beginPath();
  ctx.ellipse(78, 348, 36, 28, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(282, 348, 36, 28, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = shade(shirt, 22);
  ctx.beginPath();
  ctx.moveTo(148, 290);
  ctx.quadraticCurveTo(180, 318, 212, 290);
  ctx.lineTo(204, 312);
  ctx.quadraticCurveTo(180, 300, 156, 312);
  ctx.closePath();
  ctx.fill();

  const neck = ctx.createLinearGradient(160, 250, 200, 310);
  neck.addColorStop(0, skinLit);
  neck.addColorStop(1, skinDeep);
  ctx.fillStyle = neck;
  ctx.beginPath();
  ctx.moveTo(156, 268);
  ctx.quadraticCurveTo(180, 300, 204, 268);
  ctx.lineTo(198, 318);
  ctx.quadraticCurveTo(180, 332, 162, 318);
  ctx.closePath();
  ctx.fill();

  const cx = 180;
  const cy = 198;
  const rx = 82 * f.faceW;
  const ry = 102;

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx - rx - 4, cy + 8, 12, 18, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + rx + 4, cy + 8, 12, 18, -0.15, 0, Math.PI * 2);
  ctx.fill();

  const face = ctx.createRadialGradient(cx - 18, cy - 22, 8, cx, cy + 10, 100);
  face.addColorStop(0, skinLit);
  face.addColorStop(0.45, skin);
  face.addColorStop(1, skinDeep);
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = css(skinDeep, 0.28);
  ctx.beginPath();
  ctx.ellipse(cx - 22, cy + 28, 16, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 22, cy + 28, 16, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();

  paintHair(ctx, f.hairStyle, cx, cy, rx, ry, hair);

  ctx.strokeStyle = hair;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  const by = cy - 8 - f.brow * 10;
  ctx.beginPath();
  ctx.moveTo(cx - 28, by);
  ctx.quadraticCurveTo(cx - 16, by - 6, cx - 6, by + 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 6, by + 1);
  ctx.quadraticCurveTo(cx + 16, by - 6, cx + 28, by);
  ctx.stroke();

  paintEye(ctx, cx - 22, cy + 2, f.eye);
  paintEye(ctx, cx + 22, cy + 2, f.eye);

  ctx.fillStyle = css(skinDeep, 0.55);
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx + 7 * f.nose, cy + 32);
  ctx.lineTo(cx, cy + 36);
  ctx.lineTo(cx - 7 * f.nose, cy + 32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = css(skinLit, 0.35);
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy + 10);
  ctx.lineTo(cx + 2, cy + 30);
  ctx.lineTo(cx - 1, cy + 32);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = shade(skin, -52);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 52);
  ctx.quadraticCurveTo(cx, cy + 62, cx + 16, cy + 52);
  ctx.stroke();
  ctx.strokeStyle = css("#c45a6a", 0.45);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 51);
  ctx.quadraticCurveTo(cx, cy + 56, cx + 14, cy + 51);
  ctx.stroke();

  if (f.beard === 1) {
    ctx.fillStyle = css(hair, 0.28);
    ctx.beginPath();
    ctx.ellipse(cx, cy + 58, 30, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (f.beard === 2) {
    ctx.fillStyle = css(hair, 0.72);
    ctx.beginPath();
    ctx.moveTo(cx - 36, cy + 40);
    ctx.quadraticCurveTo(cx, cy + 92, cx + 36, cy + 40);
    ctx.quadraticCurveTo(cx, cy + 64, cx - 36, cy + 40);
    ctx.fill();
  }

  const rim = ctx.createRadialGradient(110, 90, 20, 180, 220, 260);
  rim.addColorStop(0, "rgba(255,255,255,0.16)");
  rim.addColorStop(0.5, "rgba(255,255,255,0.02)");
  rim.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, w, h);
}

function paintEye(ctx: CanvasRenderingContext2D, x: number, y: number, iris: string) {
  if (!iris) iris = "#2a1a10";
  ctx.fillStyle = "#f4efe8";
  ctx.beginPath();
  ctx.ellipse(x, y, 11, 6.6, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x, y, 1, x, y, 6);
  g.addColorStop(0, shade(iris, 40));
  g.addColorStop(0.55, iris);
  g.addColorStop(1, "#111");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.arc(x, y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x - 1.6, y - 1.8, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, y, 11, 6.6, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function paintHair(
  ctx: CanvasRenderingContext2D,
  style: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  hair: string,
) {
  ctx.fillStyle = hair;
  if (style === 0) {
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.55, rx + 6, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 1) {
    ctx.beginPath();
    ctx.moveTo(cx - rx - 8, cy + 8);
    ctx.quadraticCurveTo(cx - rx, cy - ry - 8, cx, cy - ry - 4);
    ctx.quadraticCurveTo(cx + rx, cy - ry - 8, cx + rx + 8, cy + 8);
    ctx.quadraticCurveTo(cx, cy - 20, cx - rx - 8, cy + 8);
    ctx.fill();
  } else if (style === 2) {
    ctx.fillRect(cx - rx + 6, cy - ry + 6, rx * 2 - 12, 22);
  } else if (style === 3) {
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.5, rx + 10, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hair;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy);
    ctx.quadraticCurveTo(cx - rx - 18, cy + 40, cx - rx + 8, cy + 56);
    ctx.stroke();
  } else if (style === 4) {
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy);
    ctx.quadraticCurveTo(cx, cy - ry - 16, cx + rx, cy);
    ctx.lineTo(cx, cy - 24);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.62, rx - 14, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
