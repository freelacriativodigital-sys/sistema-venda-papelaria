import { supabase } from "../../lib/supabase";

export const compressImageToBlob = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      
      img.onload = async () => {
        // --- CONFIGURAÇÃO FOCADA 100% NA NITIDEZ ---
        const TARGET_SIZE = 150 * 1024; // Teto de segurança: 150 KB
        let quality = 0.98; // COMEÇA COM QUALIDADE MÁXIMA (98%)
        const MAX_WIDTH = 1200; // Resolução gigante para telas Retina/Full HD
        const MAX_HEIGHT = 1200;

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
            // Mantendo WebP, mas agora exigindo qualidade extrema
            canvas.toBlob((blob) => res(blob), 'image/webp', q);
          });
        };

        let blob = await compress(currentWidth, currentHeight, quality);

        // Só vai tirar a qualidade se a foto, por algum milagre, passar de 150KB
        let tentativas = 0;
        while (blob.size > TARGET_SIZE && tentativas < 15) { 
          tentativas++;
          
          if (quality > 0.5) {
            quality -= 0.05; 
          } else {
            currentWidth *= 0.95;
            currentHeight *= 0.95;
          }

          blob = await compress(currentWidth, currentHeight, quality);
        }

        console.log(`Foto salva com nitidez máxima: ${(blob.size / 1024).toFixed(2)} KB em ${tentativas} tentativas.`);
        resolve(blob);
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

export const extrairCaminhoStorage = (url) => {
  if (!url) return null;
  const partes = url.split('/produtos/');
  return partes.length > 1 ? partes[1] : null;
};

export const deletarImagensDoProduto = async (produto) => {
  let pathsParaDeletar = [];
  
  if (produto.imagem_url) pathsParaDeletar.push(extrairCaminhoStorage(produto.imagem_url));
  
  if (produto.imagens && Array.isArray(produto.imagens)) {
    produto.imagens.forEach(img => pathsParaDeletar.push(extrairCaminhoStorage(img)));
  }
  
  if (produto.variacoes?.ativa && Array.isArray(produto.variacoes.atributos)) {
    produto.variacoes.atributos.forEach(atrib => {
      atrib.opcoes?.forEach(opcao => {
        if (opcao.imagem) pathsParaDeletar.push(extrairCaminhoStorage(opcao.imagem));
      });
    });
  }
  
  pathsParaDeletar = [...new Set(pathsParaDeletar.filter(Boolean))];
  
  if (pathsParaDeletar.length > 0) {
    const { error } = await supabase.storage.from('produtos').remove(pathsParaDeletar);
    if (error) console.error("Erro ao deletar imagens do storage:", error);
  }
};

export const deletarImagemUnica = async (url) => {
  const caminho = extrairCaminhoStorage(url);
  if (caminho) {
    const { error } = await supabase.storage.from('produtos').remove([caminho]);
    if (error) {
      console.error("Erro ao deletar imagem individual do storage:", error);
    } else {
      console.log("Imagem excluída definitivamente do servidor!");
    }
  }
};