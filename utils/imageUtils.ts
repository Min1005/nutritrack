
export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const scaleFactor = maxWidth / img.width;
        
        // If image is smaller than max width, don't resize
        if (scaleFactor >= 1) {
            resolve(img.src);
            return;
        }

        elem.width = maxWidth;
        elem.height = img.height * scaleFactor;
        
        const ctx = elem.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }
        
        ctx.drawImage(img, 0, 0, elem.width, elem.height);
        
        // Compress to JPEG
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
