(function (root) {
  'use strict';
  const MAX_BYTES = 5 * 1024 * 1024;
  const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  function validate(file) {
    if (!file) return;
    if (!TYPES.includes(file.type)) throw Error('JPG, PNG या WebP photo चुनें।');
    if (!file.size || file.size > MAX_BYTES) throw Error('Photo 5 MB या उससे कम होनी चाहिए।');
  }
  async function encode(file) {
    validate(file);
    if (!file) return null;
    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) throw Error('Photo बहुत बड़ी है। छोटी photo चुनें।');
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
      if (data.length > 1400000) throw Error('Photo compress नहीं हो सकी। छोटी photo चुनें।');
      return {name: 'vendor-photo.jpg', type: 'image/jpeg', data};
    } finally { bitmap.close(); }
  }
  function setup() {
    const input = document.getElementById('vendorPhoto');
    if (!input) return;
    const preview = document.getElementById('vendorPhotoPreview');
    const message = document.getElementById('vendorPhotoMessage');
    const remove = document.getElementById('removeVendorPhoto');
    let objectUrl;
    function clear() {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null; preview.removeAttribute('src'); preview.hidden = true; remove.hidden = true;
    }
    input.addEventListener('change', () => {
      clear(); message.textContent = ''; input.setCustomValidity('');
      try {
        const file = input.files[0]; validate(file);
        if (file) { objectUrl = URL.createObjectURL(file); preview.src = objectUrl; preview.hidden = false; remove.hidden = false; }
      } catch (err) { input.value = ''; message.textContent = err.message; input.setCustomValidity(err.message); }
    });
    remove.addEventListener('click', () => { input.value = ''; input.setCustomValidity(''); message.textContent = ''; clear(); });
    input.form.addEventListener('reset', () => { clear(); message.textContent = ''; input.setCustomValidity(''); });
  }
  root.RWGPhoto = {validate, encode, setup};
  if (typeof module !== 'undefined') module.exports = {validate};
})(typeof window === 'undefined' ? globalThis : window);
