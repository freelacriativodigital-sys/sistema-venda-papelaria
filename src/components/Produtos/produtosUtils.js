import { supabase } from "../../lib/supabase";

export const compressImageToBlob = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        const MAX_HEIGHT = 800;
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