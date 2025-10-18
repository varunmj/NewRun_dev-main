/**
 * Test utility for image compression functionality
 * This can be used to test compression in development
 */

import imageCompression from 'browser-image-compression';

export const testImageCompression = async (file) => {
  console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    onProgress: (progress) => {
      console.log('Compression progress:', Math.round(progress), '%');
    }
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Compression ratio:', ((1 - compressedFile.size / file.size) * 100).toFixed(1), '%');
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
};

export const getFileSizeInfo = (file) => {
  const sizeInMB = file.size / 1024 / 1024;
  return {
    sizeInMB: sizeInMB.toFixed(2),
    sizeInBytes: file.size,
    needsCompression: sizeInMB > 2,
    isTooLarge: sizeInMB > 30
  };
};
