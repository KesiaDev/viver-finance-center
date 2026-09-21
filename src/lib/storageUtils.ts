export const extractStoragePath = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    const parts = pathname.split('/');
    const publicIndex = parts.indexOf('public');
    const objectIndex = parts.indexOf('object');
    
    if (publicIndex !== -1) {
      return parts.slice(publicIndex + 2).join('/');
    } else if (objectIndex !== -1) {
      return parts.slice(objectIndex + 2).join('/');
    }
    
    return parts.slice(-2).join('/');
  } catch (error) {
    console.error('Erro ao extrair path:', error);
    return url.split('/').slice(-2).join('/');
  }
};
