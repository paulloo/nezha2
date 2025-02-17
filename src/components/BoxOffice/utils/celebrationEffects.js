import confetti from 'canvas-confetti';

export const triggerCelebration = () => {
  const colors = ['#ec4899', '#8b5cf6', '#6366f1', '#06b6d4', '#10b981'];
  
  // 从底部发射
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.9 },
    colors: colors,
    startVelocity: 45,
    gravity: 1.2,
    drift: 0,
    ticks: 300
  });

  // 从左侧发射
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      colors: colors,
      startVelocity: 35
    });
  }, 250);

  // 从右侧发射
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      colors: colors,
      startVelocity: 35
    });
  }, 400);

  // 从中间向四周爆发
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 360,
      startVelocity: 45,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      shapes: ['square', 'circle'],
      scalar: 1.2
    });
  }, 600);

  // 持续烟花效果
  setTimeout(() => {
    const end = Date.now() + 1000;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, 800);
};
