export interface EncodeOptions {
  newlineSeparator: string;
  encodeEachLine: boolean;
  splitChunks: boolean;
  urlSafe: boolean;
  k8sSecret: boolean;
  charset?: string; // Currently supports UTF-8 implicitly, added for future extensibility
}

// Default options
const defaultOptions: EncodeOptions = {
  newlineSeparator: '\n',
  encodeEachLine: false,
  splitChunks: false,
  urlSafe: false,
  k8sSecret: false,
};

export function encodeBase64Text(text: string, options: Partial<EncodeOptions> = {}): string {
  if (!text) return '';
  const opts = { ...defaultOptions, ...options };

  try {
    if (opts.k8sSecret) {
      const lines = text.split(/\r?\n/);
      const processedLines = lines.map(line => {
        const match = line.match(/^([^:=]+)([:=])\s*(.*)$/);
        if (match) {
          const key = match[1];
          const separator = match[2];
          const value = match[3];
          if (!value.trim()) return line;
          
          // Encode only the value part without k8sSecret recursiveness
          const encodedValue = encodeBase64Text(value, { 
            ...opts, 
            k8sSecret: false,
            encodeEachLine: false 
          });
          return `${key}${separator} ${encodedValue}`;
        }
        return line;
      });
      return processedLines.join(opts.newlineSeparator);
    }

    let result = '';

    if (opts.encodeEachLine) {
      const lines = text.split(/\r?\n/);
      const encodedLines = lines.map(line => {
        const bytes = new TextEncoder().encode(line);
        const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
        return btoa(binString);
      });
      result = encodedLines.join(opts.newlineSeparator);
    } else {
      const bytes = new TextEncoder().encode(text);
      const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
      result = btoa(binString);
    }

    if (opts.urlSafe) {
      result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    if (opts.splitChunks) {
      const chunks = result.match(/.{1,76}/g) || [];
      result = chunks.join(opts.newlineSeparator);
    }

    return result;
  } catch (error) {
    throw new Error('Failed to encode text to Base64');
  }
}

export function decodeBase64Text(base64: string, _options: Partial<EncodeOptions> = {}): string {
  if (!base64) return '';

  try {
    let cleanedBase64 = base64.replace(/\s+/g, '');
    cleanedBase64 = cleanedBase64.replace(/-/g, '+').replace(/_/g, '/');
    
    while (cleanedBase64.length % 4 !== 0) {
      cleanedBase64 += '=';
    }

    const binString = atob(cleanedBase64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return new TextDecoder().decode(bytes);
  } catch (error) {
    throw new Error('Invalid Base64 string');
  }
}

// Improved decode for encodeEachLine and k8sSecret
export function advancedDecodeBase64Text(base64: string, options: Partial<EncodeOptions> = {}): string {
  if (!base64) return '';
  const opts = { ...defaultOptions, ...options };

  try {
    if (opts.k8sSecret) {
      const lines = base64.split(/\r?\n/);
      const processedLines = lines.map(line => {
        const match = line.match(/^([^:=]+)([:=])\s*(.*)$/);
        if (match) {
          const key = match[1];
          const separator = match[2];
          const value = match[3].trim();
          if (!value) return line;

          try {
            const decodedValue = advancedDecodeBase64Text(value, { 
              ...opts, 
              k8sSecret: false,
              encodeEachLine: false 
            });
            return `${key}${separator} ${decodedValue}`;
          } catch (e) {
            return line; // Fallback if not valid base64
          }
        }
        return line;
      });
      return processedLines.join(opts.newlineSeparator);
    }

    if (opts.encodeEachLine) {
       const lines = base64.split(/\r?\n/);
       const decodedLines = lines.map(line => {
         if (!line.trim()) return '';
         let cleaned = line.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
         while (cleaned.length % 4 !== 0) cleaned += '=';
         const binString = atob(cleaned);
         const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
         return new TextDecoder().decode(bytes);
       });
       return decodedLines.join(opts.newlineSeparator);
    } else {
       let cleanedBase64 = base64.replace(/\s+/g, '');
       cleanedBase64 = cleanedBase64.replace(/-/g, '+').replace(/_/g, '/');
       while (cleanedBase64.length % 4 !== 0) cleanedBase64 += '=';
       const binString = atob(cleanedBase64);
       const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
       return new TextDecoder().decode(bytes);
    }
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
