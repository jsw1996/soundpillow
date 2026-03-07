import type { MoodConfig } from '../data/moodMessages';

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** CJK-aware text wrapping: splits by spaces for Latin/mixed text,
 *  falls back to per-character wrapping for CJK-only text. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number,
  maxLines: number,
): void {
  const fitEllipsis = (line: string): string => {
    const ellipsis = '…';
    if (ctx.measureText(line + ellipsis).width <= maxWidth) return line + ellipsis;
    let trimmed = line;
    while (trimmed.length > 0 && ctx.measureText(trimmed + ellipsis).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed.trimEnd() + ellipsis;
  };

  const lines: string[] = [];
  const hasCJK = /[\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(text);
  const hasSpaces = text.includes(' ');

  if (hasCJK && !hasSpaces) {
    let line = '';
    for (const char of text) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
  } else {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? line + ' ' + word : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
  }

  const shouldTruncate = lines.length > maxLines;
  const visible = shouldTruncate ? lines.slice(0, maxLines) : lines;
  if (shouldTruncate && visible.length > 0) {
    visible[visible.length - 1] = fitEllipsis(visible[visible.length - 1]);
  }

  let currentY = y;
  for (const line of visible) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateShareImage(
  config: MoodConfig,
  message: string,
  dateLabel: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1080;
    const H = 1350; // 4:5 portrait — classic Polaroid proportion
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const fontStack =
      'system-ui, "Hiragino Sans", "Apple SD Gothic Neo", "Noto Sans SC", "Noto Sans JP", sans-serif';

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // ── Background ────────────────────────────────────────────────────
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, config.gradientFrom + '30');
      bgGrad.addColorStop(1, config.gradientTo + '30');
      ctx.fillStyle = '#f5f0eb';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Polaroid card ─────────────────────────────────────────────────
      const pad = 64;
      const cardX = pad, cardY = pad;
      const cardW = W - pad * 2, cardH = H - pad * 2;

      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fff';
      roundRect(ctx, cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // ── Photo area ────────────────────────────────────────────────────
      const photoPad = 48;
      const photoX = cardX + photoPad, photoY = cardY + photoPad;
      const photoW = cardW - photoPad * 2, photoH = photoW;

      ctx.save();
      roundRect(ctx, photoX, photoY, photoW, photoH, 8);
      ctx.clip();

      // Cover-fit
      const ratio = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (ratio > 1) { sw = img.height; sx = (img.width - sw) / 2; }
      else            { sh = img.width;  sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);

      // Gradient overlay for date readability
      const overlayGrad = ctx.createLinearGradient(
        photoX, photoY + photoH - 120, photoX, photoY + photoH,
      );
      overlayGrad.addColorStop(0, 'rgba(0,0,0,0)');
      overlayGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(photoX, photoY, photoW, photoH);
      ctx.restore();

      // Date label
      const cx = photoX + photoW / 2;
      ctx.font = `600 28px ${fontStack}`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(dateLabel, cx, photoY + photoH - 40);

      // ── White strip — emoji + message ─────────────────────────────────
      const msgY = photoY + photoH + 56;
      ctx.font = '56px serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(config.emoji, cx, msgY);

      ctx.font = `600 40px ${fontStack}`;
      ctx.fillStyle = '#2a2a2a';
      ctx.textBaseline = 'alphabetic';
      wrapText(ctx, `"${message}"`, cx, msgY + 72, photoW - 20, 56, 4);

      // ── Branding footer ───────────────────────────────────────────────
      ctx.font = `500 26px ${fontStack}`;
      ctx.fillStyle = '#bbb';
      ctx.fillText('SoundPillow ✦ mood card', cx, cardY + cardH - 44);

      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to load mood image'));
    img.src = config.imageUrl;
  });
}
