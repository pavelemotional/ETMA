import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.5, // Максимум 0.5MB
  maxWidthOrHeight: 1024, // Максимальная ширина/высота 1024px
  useWebWorker: true,
};

export const compressImage = async (
  file: File,
  options: CompressionOptions = DEFAULT_OPTIONS
): Promise<File> => {
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB || 0.5,
      maxWidthOrHeight: options.maxWidthOrHeight || 1024,
      useWebWorker: options.useWebWorker !== false,
      onProgress: (progress) => {
        console.log(`Сжатие изображения: ${Math.round(progress)}%`);
      },
    });
    
    console.log(
      `Изображение сжато: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
    );
    
    return compressedFile;
  } catch (error) {
    console.error('Ошибка при сжатии изображения:', error);
    throw new Error('Не удалось сжать изображение');
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const compressAndConvertToBase64 = async (
  file: File,
  options: CompressionOptions = DEFAULT_OPTIONS
): Promise<string> => {
  const compressedFile = await compressImage(file, options);
  return await fileToBase64(compressedFile);
};
