import { supabase } from "../../lib/supabase";

export const compressImageToBlob = (file) => {
  return new Promise((resolve, reject) => {
    
    const TARGET_SIZE = 50 * 1024; // Novo alvo rigoroso: 50 KB

    // 1. PASSE LIVRE: Se a foto JÁ FOR MENOR ou igual a 50KB, não mexe em absolutamente nada!
    if (file.size <= TARGET_SIZE) {
      console.log(`A foto já tem ${(file.size / 1024).toFixed(2)} KB. Passou direto sem compressão!`);
      return resolve(file); 
    }

    // 2. DESCIDA SUAVE: Se for maior que 50KB, vai descer bem devagar para preservar a qualidade.
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      
      img.onload = async () => {
        let quality = 0.99; // Começa quase no 100% para não perder peso bruscamente
        const MAX_WIDTH = 800; // Tamanho ideal para celular
        const MAX_HEIGHT = 800;

        let currentWidth = img.width;
        let currentHeight = img.height;

        if (currentWidth > currentHeight) {
          if (currentWidth > MAX_WIDTH) { currentHeight *= MAX_WIDTH / currentWidth; currentWidth = MAX_WIDTH; }
        } else {
          if (currentHeight > MAX_HEIGHT) { currentWidth *= MAX_HEIGHT / currentHeight; currentHeight = MAX_HEIGHT; }
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const compress = (w, h, q) => {
          return new Promise((res) => {
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob((blob) => res(blob), 'image/webp', q);
          });
        };

        let blob = await compress(currentWidth, currentHeight, quality);

        let tentativas = 0;
        // O loop para NA HORA que a foto bater o limite de 50KB.
        while (blob.size > TARGET_SIZE && tentativas < 30) { 
          tentativas++;
          
          if (quality > 0.6) {
            quality -= 0.02; // Tira só 2% de cada vez (passo de formiguinha) para parar o mais perto possível dos 50KB
          } else {
            currentWidth *= 0.95; // Se a qualidade chegou a 60%, reduz o tamanho muito pouquinho
            currentHeight *= 0.95;
          }
          
          blob = await compress(currentWidth, currentHeight, quality);
        }

        console.log(`Foto reduzida e cravada em: ${(blob.size / 1024).toFixed(2)} KB.`);
        resolve(blob);
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

// Extrai apenas o nome do ficheiro da URL pública (Agora à prova de falhas e maiúsculas)
export const extrairCaminhoStorage = (url) => {
  if (!url) return null;
  // O "match" procura por "/produtos/" não importando se está em maiúscula ou minúscula
  const match = url.match(/\/produtos\/(.+)/i);
  return match ? match[1] : null;
};

// LIXEIRA INDIVIDUAL (Agora com Alarme na tela!)
export const deletarImagemUnica = async (url) => {
  try {
    const caminho = extrairCaminhoStorage(url);
    
    if (!caminho) {
      alert("🚨 ERRO DE LINK: O sistema não conseguiu encontrar o caminho na URL:\n" + url);
      return;
    }

    const { data, error } = await supabase.storage.from('produtos').remove([caminho]);
    
    if (error) {
      alert("🔒 BLOQUEIO DO SUPABASE:\n" + error.message);
      console.error("Erro exato do Supabase:", error);
    } else {
      alert("✅ SUCESSO: A foto foi destruída do servidor!");
      console.log("Arquivo apagado do Supabase:", data);
    }
  } catch (err) {
    alert("🚨 ERRO NO CÓDIGO:\n" + err.message);
  }
};