import { useRef, useEffect, useState } from 'react';

const MagicBackground = ({ 
  className = '',
  glowColor = '132, 0, 255',
  enableGlow = true,
  intensity = 0.3
}) => {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    const handleMouseMove = (e) => {
      if (!enableGlow) return;
      
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePos({ x, y });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enableGlow]);

  const backgroundStyle = enableGlow && isHovered ? {
    background: `
      radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, 
        rgba(${glowColor}, ${intensity * 0.15}) 0%, 
        rgba(${glowColor}, ${intensity * 0.08}) 30%, 
        transparent 60%),
      rgba(255, 255, 255, 0.02)
    `,
    boxShadow: `0 0 20px rgba(${glowColor}, ${intensity * 0.2})`,
    transition: 'all 0.3s ease'
  } : {
    background: 'rgba(255, 255, 255, 0.02)',
    transition: 'all 0.3s ease'
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-inherit ${className}`}
      style={backgroundStyle}
    />
  );
};

export default MagicBackground;
