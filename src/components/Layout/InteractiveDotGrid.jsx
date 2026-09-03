import React, { useEffect, useRef } from 'react';

export default function InteractiveDotGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let mouse = { x: -1000, y: -1000, active: false };

    let dots = [];

    class Dot {
      constructor(x, y, isText = false) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.vx = 0;
        this.vy = 0;
        this.isText = isText;
        this.radius = isText ? 1.5 : 1.2;
      }

      update() {
        const spring = this.isText ? 0.08 : 0.05;
        const damping = 0.88;
        const repulsionRadius = this.isText ? 35 : 60;
        const repulsionStrength = 55;

        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repulsionRadius) {
            const force = (repulsionRadius - dist) / repulsionRadius;
            const angle = Math.atan2(dy, dx);

            const forceMultiplier = this.isText ? 0.03 : 0.15;
            this.vx += Math.cos(angle) * force * repulsionStrength * forceMultiplier;
            this.vy += Math.sin(angle) * force * repulsionStrength * forceMultiplier;
          }
        }

        const ax = (this.targetX - this.x) * spring;
        const ay = (this.targetY - this.y) * spring;

        this.vx = (this.vx + ax) * damping;
        this.vy = (this.vy + ay) * damping;

        this.x += this.vx;
        this.y += this.vy;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.isText) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        } else {
          ctx.fillStyle = 'rgba(100, 100, 115, 0.65)';
        }
        ctx.fill();
      }
    }

    const initDots = () => {
      dots = [];
      const width = canvas.width;
      const height = canvas.height;

      const gridSpacing = 35;
      const startX = (width % gridSpacing) / 2;
      const startY = (height % gridSpacing) / 2;

      for (let x = startX; x < width; x += gridSpacing) {
        for (let y = startY; y < height; y += gridSpacing) {
          dots.push(new Dot(x, y, false));
        }
      }

      const isMobile = width < 768;

      // Only render 'Fellowships through service' particle text on desktop and tablet viewports
      if (!isMobile) {
        const offscreen = document.createElement('canvas');
        const offscreenCtx = offscreen.getContext('2d');
        offscreen.width = width;
        offscreen.height = height;

        offscreenCtx.fillStyle = '#000000';
        offscreenCtx.textAlign = 'left';
        offscreenCtx.textBaseline = 'top';

        const text = "'Fellowships through service'";
        const fontSize = Math.min(width * 0.05, 80);
        offscreenCtx.font = `600 ${fontSize}px 'Dancing Script', 'Satisfy', cursive`;

        const textX = (width * 0.04) + Math.max(10, width * 0.02);
        const textY = height * 0.85;

        offscreenCtx.fillText(text, textX, textY);

        const imgData = offscreenCtx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const textSampleSpacing = 3.5;

        for (let y = 0; y < height; y += textSampleSpacing) {
          for (let x = 0; x < width; x += textSampleSpacing) {
            const index = (Math.floor(y) * width + Math.floor(x)) * 4;
            const alpha = data[index + 3];
            if (alpha > 65) {
              dots.push(new Dot(x, y, true));
            }
          }
        }
      }
    };

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : (canvas.clientWidth || window.innerWidth);
      const height = parent ? parent.clientHeight : (canvas.clientHeight || window.innerHeight);

      canvas.width = width;
      canvas.height = height;
      initDots();
    };

    const parent = canvas.closest('.snap-section') || canvas.parentElement;

    const handleMouseMove = (e) => {
      if (!parent) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    document.fonts.ready.then(() => {
      resizeCanvas();
    });

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);

      const handleTouchMove = (e) => {
        if (e.touches.length > 0) {
          const rect = canvas.getBoundingClientRect();
          mouse.x = e.touches[0].clientX - rect.left;
          mouse.y = e.touches[0].clientY - rect.top;
          mouse.active = true;
        }
      };
      parent.addEventListener('touchmove', handleTouchMove, { passive: true });
      parent.addEventListener('touchend', handleMouseLeave, { passive: true });
    }

    const snapContainer = document.querySelector('.snap-container') || (canvas && canvas.closest ? canvas.closest('.snap-container') : null);

    const handleScroll = () => {
      const containerScroll = snapContainer ? snapContainer.scrollTop : 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop;
      const scrollY = Math.max(containerScroll, windowScroll);

      const fadeStart = 30;
      const fadeEnd = 280;

      let opacity = 1;
      if (scrollY > fadeStart) {
        opacity = Math.max(0, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
      }

      if (canvas) {
        canvas.style.opacity = opacity.toFixed(3);
        canvas.style.pointerEvents = opacity === 0 ? 'none' : 'auto';
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (snapContainer) {
      snapContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        dot.update();
        dot.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      if (snapContainer) {
        snapContainer.removeEventListener('scroll', handleScroll);
      }
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
        transition: 'opacity 0.15s ease-out'
      }}
    />
  );
}
