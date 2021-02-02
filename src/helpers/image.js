const toDataUrl = (bitmap) => {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (context) {
    context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
    const image = canvas.toDataURL();
    return image;
  }
  return '';
};

export {
  toDataUrl,
};