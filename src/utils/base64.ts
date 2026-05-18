export function encodeBase64Text(text: string): string {
  if (!text) return '';
  try {
    const bytes = new TextEncoder().encode(text);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
    return btoa(binString);
  } catch (error) {
    throw new Error('Failed to encode text to Base64');
  }
}

export function decodeBase64Text(base64: string): string {
  if (!base64) return '';
  try {
    const cleanedBase64 = base64.replace(/\s+/g, '');
    const binString = atob(cleanedBase64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return new TextDecoder().decode(bytes);
  } catch (error) {
    throw new Error('Invalid Base64 string');
  }
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
