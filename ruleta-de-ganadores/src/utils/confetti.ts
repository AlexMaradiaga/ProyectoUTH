// Lightweight canvas confetti particle system

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

export function launchConfetti() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#eab308'];
  const particles: Particle[] = [];

  // Create 150 particles bursting from bottom-center or full screen
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: width * (0.3 + Math.random() * 0.4),
      y: height * 0.5,
      vx: (Math.random() - 0.5) * 18,
      vy: -Math.random() * 20 - 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 6,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      alpha: 1
    });
  }

  let animationFrame: number;
  let startTime = performance.now();

  function render(now: number) {
    const elapsed = now - startTime;
    ctx!.clearRect(0, 0, width, height);

    let activeCount = 0;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravity
      p.vx *= 0.98; // drag
      p.rotation += p.vRot;

      if (elapsed > 2000) {
        p.alpha -= 0.02;
      }

      if (p.alpha > 0 && p.y < height + 50) {
        activeCount++;
        ctx!.save();
        ctx!.globalAlpha = Math.max(0, p.alpha);
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx!.restore();
      }
    });

    if (activeCount > 0 && elapsed < 4000) {
      animationFrame = requestAnimationFrame(render);
    } else {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  animationFrame = requestAnimationFrame(render);
}
