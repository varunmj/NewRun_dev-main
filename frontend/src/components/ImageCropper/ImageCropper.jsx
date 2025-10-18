import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { MdClose, MdCheck, MdRotateLeft, MdRotateRight, MdZoomIn, MdZoomOut } from 'react-icons/md';

const ImageCropper = ({ 
  imageSrc, 
  onCropComplete, 
  onClose, 
  aspectRatio = 1,
  circularCrop = true 
}) => {
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, [aspectRatio]);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onCropCompleteCallback = useCallback((crop) => {
    setCompletedCrop(crop);
  }, []);

  const rotateImage = (direction) => {
    setRotate(prev => direction === 'left' ? prev - 90 : prev + 90);
  };

  const flipImage = (direction) => {
    setFlip(prev => ({
      ...prev,
      [direction]: !prev[direction]
    }));
  };

  const zoomImage = (direction) => {
    setScale(prev => {
      const newScale = direction === 'in' ? prev * 1.1 : prev * 0.9;
      return Math.max(0.5, Math.min(3, newScale));
    });
  };

  const getCroppedImg = (image, cropData, fileName = 'cropped-image.jpg') => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = cropData.width * pixelRatio * scaleX;
      canvas.height = cropData.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      const cropX = cropData.x * scaleX;
      const cropY = cropData.y * scaleY;

      const rotateRads = (rotate * Math.PI) / 180;
      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();

      // Move the crop origin to the canvas origin (0,0)
      ctx.translate(-cropX, -cropY);
      // Move the origin to the center of the original position
      ctx.translate(centerX, centerY);
      // Rotate around the origin
      ctx.rotate(rotateRads);
      // Scale the image up or down
      ctx.scale(flip.horizontal ? -scale : scale, flip.vertical ? -scale : scale);
      // Move the center of the image to the origin (0,0)
      ctx.translate(-centerX, -centerY);
      // Draw the image
      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight
      );

      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Canvas is empty');
          }
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'profile-picture.jpg'
      );
      
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#121318] rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Crop Your Profile Picture</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* Rotate Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => rotateImage('left')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Rotate Left"
              >
                <MdRotateLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => rotateImage('right')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Rotate Right"
              >
                <MdRotateRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => zoomImage('out')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <MdZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/60 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => zoomImage('in')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Zoom In"
              >
                <MdZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Flip Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => flipImage('horizontal')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  flip.horizontal 
                    ? 'bg-violet-500 text-white' 
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                Flip H
              </button>
              <button
                onClick={() => flipImage('vertical')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  flip.vertical 
                    ? 'bg-violet-500 text-white' 
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                Flip V
              </button>
            </div>
          </div>
        </div>

        {/* Image Cropper */}
        <div className="p-4 max-h-[60vh] overflow-auto">
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={onCropChange}
              onComplete={onCropCompleteCallback}
              aspect={aspectRatio}
              circularCrop={circularCrop}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg) scaleX(${flip.horizontal ? -1 : 1}) scaleY(${flip.vertical ? -1 : 1})`,
                  maxHeight: '400px',
                  maxWidth: '400px',
                }}
                onLoad={onImageLoad}
                className="rounded-lg"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.07] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            disabled={!completedCrop || isProcessing}
            className="px-4 py-2 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-500/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MdCheck className="w-4 h-4" />
                Use This Photo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageCropper;
