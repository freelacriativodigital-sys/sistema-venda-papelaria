export const base44 = {
  get: async (entity) => {
    const data = JSON.parse(localStorage.getItem(`db_${entity}`)) || [];
    return data;
  },
  create: async (entity, payload) => {
    const data = JSON.parse(localStorage.getItem(`db_${entity}`)) || [];
    const newItem = { 
      ...payload, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString() 
    };
    data.push(newItem);
    localStorage.setItem(`db_${entity}`, JSON.stringify(data));
    return newItem;
  },
  update: async (entity, id, payload) => {
    let data = JSON.parse(localStorage.getItem(`db_${entity}`)) || [];
    data = data.map(item => item.id === id ? { ...item, ...payload } : item);
    localStorage.setItem(`db_${entity}`, JSON.stringify(data));
    return { success: true };
  },
  delete: async (entity, id) => {
    let data = JSON.parse(localStorage.getItem(`db_${entity}`)) || [];
    data = data.filter(item => item.id !== id);
    localStorage.setItem(`db_${entity}`, JSON.stringify(data));
    return { success: true };
  }
};