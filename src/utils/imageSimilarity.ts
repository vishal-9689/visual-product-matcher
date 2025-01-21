// Simple color-based image similarity comparison
export async function compareImages(image1Url: string, image2Url: string): Promise<number> {
  try {
    // Create an off-screen canvas
    const getImageData = async (url: string): Promise<ImageData> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          canvas.width = 50; // Resize for performance
          canvas.height = 50;
          
          // Draw and get image data
          try {
            ctx.drawImage(img, 0, 0, 50, 50);
            const imageData = ctx.getImageData(0, 0, 50, 50);
            resolve(imageData);
          } catch (error) {
            reject(new Error('Failed to process image data'));
          }
        };

        img.onerror = () => {
          // Try adding a cache-busting parameter for CORS
          if (!url.includes('?')) {
            img.src = `${url}?cb=${Date.now()}`;
          } else {
            reject(new Error('Failed to load image'));
          }
        };

        // Add cache-busting parameter to help with CORS
        img.src = url.includes('?') ? url : `${url}?cb=${Date.now()}`;
      });
    };

    const [img1Data, img2Data] = await Promise.all([
      getImageData(image1Url),
      getImageData(image2Url),
    ]);

    let totalDiff = 0;
    const totalPixels = img1Data.data.length / 4;

    // Compare RGB values of each pixel
    for (let i = 0; i < img1Data.data.length; i += 4) {
      const r1 = img1Data.data[i];
      const g1 = img1Data.data[i + 1];
      const b1 = img1Data.data[i + 2];
      
      const r2 = img2Data.data[i];
      const g2 = img2Data.data[i + 1];
      const b2 = img2Data.data[i + 2];
      
      // Calculate color difference using a more forgiving algorithm
      const pixelDiff = Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
      ) / Math.sqrt(Math.pow(255, 2) * 3);
      
      totalDiff += 1 - pixelDiff;
    }

    // Return similarity score
    return totalDiff / totalPixels;
  } catch (error) {
    console.error('Error comparing images:', error);
    return 0;
  }
}