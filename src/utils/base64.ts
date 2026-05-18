export interface EncodeOptions {
  newlineSeparator: string;
  encodeEachLine: boolean;
  splitChunks: boolean;
  urlSafe: boolean;
  charset?: string; // Currently supports UTF-8 implicitly, added for future extensibility
}

// Default options
const defaultOptions: EncodeOptions = {
  newlineSeparator: '\n',
  encodeEachLine: false,
  splitChunks: false,
  urlSafe: false,
};

export function encodeBase64Text(text: string, options: Partial<EncodeOptions> = {}): string {
  if (!text) return '';
  const opts = { ...defaultOptions, ...options };

  try {
    let result = '';

    if (opts.encodeEachLine) {
      // Split by common newlines (\r\n or \n)
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
      // Split into 76-character chunks
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
    // If it was split into chunks or has newlines, remove them for decoding
    let cleanedBase64 = base64.replace(/\s+/g, '');
    
    // Always attempt to handle URL-safe format by replacing back
    cleanedBase64 = cleanedBase64.replace(/-/g, '+').replace(/_/g, '/');
    
    // Pad with '=' if necessary
    while (cleanedBase64.length % 4 !== 0) {
      cleanedBase64 += '=';
    }

    const binString = atob(cleanedBase64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    
    // Decode back to text
    return new TextDecoder().decode(bytes);
    
    // Note: decode doesn't fully reverse "encodeEachLine" perfectly if the original text had no newlines
    // but the user encoded each line separately. Actually, decodeBase64Text will decode the whole block 
    // together if it's one big base64 string. 
    // If encodeEachLine was used, the base64 string has newlines, which we just stripped above,
    // wait... if encodeEachLine was used, each line was encoded individually!
    // That means we can't just strip newlines and decode the whole thing as one continuous base64 string,
    // because padding (=) might exist in the middle of the document!
    // So if encodeEachLine is used, we need to decode line by line.
  } catch (error) {
    throw new Error('Invalid Base64 string');
  }
}

// Improved decode for encodeEachLine
export function advancedDecodeBase64Text(base64: string, options: Partial<EncodeOptions> = {}): string {
  if (!base64) return '';
  const opts = { ...defaultOptions, ...options };

  try {
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
