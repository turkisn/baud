export function safeDownloadName(name) {
  if (typeof name !== 'string') return 'buod-product-file';
  const basename = [...name.split(/[\\/]/).at(-1)].filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127).join('').trim();
  return basename && basename !== '.' && basename !== '..' ? basename.slice(0, 200) : 'buod-product-file';
}
