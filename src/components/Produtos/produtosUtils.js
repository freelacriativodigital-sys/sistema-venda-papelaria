import { supabase } from "../../lib/supabase";

export const compressImageToBlob = (file) => {
  return new Promise((resolve, reject) => {
    
    const TARGET_SIZE = 45 * 1024; // O alvo rigoroso: 45 KB

    // 1. PASSE LIVRE: Se a foto JÁ FOR MENOR ou igual a 45KB, não mexe em absolutamente nada!
    if (file.size <= TARGET_SIZE) {
      console.log(`A foto já tem ${(file.size / 1024).toFixed(2)} KB. Passou direto sem compressão!`);
      return resolve(file); 
    }

    // 2. DESCIDA SUAVE: Se for maior que 45KB (ex: 55KB, 1MB), vai descer bem devagar.
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
        // O loop para NA HORA que a foto bater o limite de 45KB.
        while (blob.size > TARGET_SIZE && tentativas < 30) { 
          tentativas++;
          
          if (quality > 0.6) {
            quality -= 0.02; // Tira só 2% de cada vez (passo de formiguinha) para parar o mais perto possível dos 45KB
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

// Extrai apenas o nome do ficheiro da URL pública do Supabase
export const extrairCaminhoStorage = (url) => {
  if (!url) return null;
  const partes = url.split('/produtos/');
  return partes.length > 1 ? partes[1] : null;
};

// LIXEIRA TOTAL: Apaga TODAS as fotos quando você exclui o produto
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

// LIXEIRA INDIVIDUAL: Apaga UMA única foto (usado no botão X vermelho ou ao editar)
export const deletarImagemUnica = async (url) => {
  const caminho = extrairCaminhoStorage(url);
  if (caminho) {
    const { error } = await supabase.storage.from('produtos').remove([caminho]);
    if (error) {
      console.error("Erro ao deletar imagem individual do storage:", error);
    } else {
      console.log("Imagem excluída definitivamente do servidor Supabase!");
    }
  }
};