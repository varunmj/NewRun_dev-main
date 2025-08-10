import React from 'react';

const SplineGlobe = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <iframe
        src="https://my.spline.design/meeet-0951a7e62688060d998e51cd9f1a02e1/"
        frameBorder="0"
        width="100%"
        height="100%"
        style={{
          border: 'none',
          position: 'absolute', 
          top: 0, 
          left: 0,
          zIndex: 1,  // Ensure iframe stays behind other UI components
          overflow: 'hidden'
        }}
      ></iframe>
    </div>
  );
};

export default SplineGlobe;