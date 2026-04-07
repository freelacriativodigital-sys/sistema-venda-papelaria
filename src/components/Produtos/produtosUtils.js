import { supabase } from "../../lib/supabase";

export const compressImageToBlob = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      
      img.onload = async () => {
        // --- CONFIGURAÇÃO EQUILIBRADA (50KB e 800px) ---
        const TARGET_SIZE = 50 * 1024; // Meta: 50 KB (em bytes)
        let quality = 0.8; // Qualidade inicial (80%)
        const MAX_WIDTH = 800; // Tamanho ideal para nitidez no celular e PC
        const MAX_HEIGHT = 800;

        let currentWidth = img.width;
        let currentHeight = img.height;

        // Ajuste inicial (Garante que a imagem crua nunca passe de 800px)
        if (currentWidth > currentHeight) {
          if (currentWidth > MAX_WIDTH) { currentHeight *= MAX_WIDTH / currentWidth; currentWidth = MAX_WIDTH; }
        } else {
          if (currentHeight > MAX_HEIGHT) { currentWidth *= MAX_HEIGHT / currentHeight; currentHeight = MAX_HEIGHT; }
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Função auxiliar encapsulada para gerar o Blob e medir
        const compress = (w, h, q) => {
          return new Promise((res) => {
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob((blob) => res(blob), 'image/webp', q);
          });
        };

        // 1ª Tentativa de compressão
        let blob = await compress(currentWidth, currentHeight, quality);

        // A MÁGICA: O "Looping da Teimosia"
        // Fica tentando até ficar menor ou igual a 50KB
        let tentativas = 0;
        while (blob.size > TARGET_SIZE && tentativas < 15) { 
          tentativas++;
          
          // Tira 10% de qualidade por rodada para tentar salvar os pixels
          if (quality > 0.3) {
            quality -= 0.10; 
          } else {
            // Se a qualidade já chegou no mínimo (30%), diminui o tamanho físico da foto em 10%
            currentWidth *= 0.90;
            currentHeight *= 0.90;
          }

          blob = await compress(currentWidth, currentHeight, quality);
        }

        console.log(`Foto comprimida com sucesso: ${(blob.size / 1024).toFixed(2)} KB em ${tentativas} tentativas extras.`);
        resolve(blob);
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

// Extrai apenas o nome do arquivo da URL pública do Supabase
export const extrairCaminhoStorage = (url) => {
  if (!url) return null;
  const partes = url.split('/produtos/');
  return partes.length > 1 ? partes[1] : null;
};

// Função caçadora: Acha e deleta TODAS as fotos ligadas ao produto
export const deletarImagensDoProduto = async (produto) => {
  let pathsParaDeletar = [];
  
  // 1. Capa principal
  if (produto.imagem_url) pathsParaDeletar.push(extrairCaminhoStorage(produto.imagem_url));
  
  // 2. Galeria de fotos
  if (produto.imagens && Array.isArray(produto.imagens)) {
    produto.imagens.forEach(img => pathsParaDeletar.push(extrairCaminhoStorage(img)));
  }
  
  // 3. Fotos escondidas nas variações (Ex: Foto da blusa vermelha)
  if (produto.variacoes?.ativa && Array.isArray(produto.variacoes.atributos)) {
    produto.variacoes.atributos.forEach(atrib => {
      atrib.opcoes?.forEach(opcao => {
        if (opcao.imagem) pathsParaDeletar.push(extrairCaminhoStorage(opcao.imagem));
      });
    });
  }
  
  // Remove links vazios e duplicados
  pathsParaDeletar = [...new Set(pathsParaDeletar.filter(Boolean))];
  
  // Deleta tudo do servidor de uma vez só
  if (pathsParaDeletar.length > 0) {
    const { error } = await supabase.storage.from('produtos').remove(pathsParaDeletar);
    if (error) console.error("Erro ao deletar imagens do storage:", error);
  }
};

// --- NOVA FUNÇÃO ---
// Apaga uma única imagem do Storage (ideal para o botão X da galeria e exclusões pontuais)
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