import { supabase } from "../../lib/supabase";

// --- COMPRESSOR DE IMAGENS (1200px para Banners Full-Width / 80% WebP) ---
export const compressImageToBlob = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
      };
    };
  });
};

// --- FUNÇÃO DE FAXINA (DELETA DO SUPABASE REAL) ---
export const deletePhysicalFile = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('produtos/')) return;
  try {
    const parts = url.split('produtos/');
    if (parts.length > 1) {
      const fileName = parts[1].split('?')[0]; 
      if (fileName) {
        await supabase.storage.from('produtos').remove([fileName]);
      }
    }
  } catch (error) { console.error("Erro na exclusão física:", error); }
};