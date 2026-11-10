/**
 * Byte-Pair Encoding (BPE) Tokenizer
 * 
 * A from-scratch implementation of BPE for educational purposes.
 * BPE works by iteratively merging the most frequent pair of tokens.
 */

export interface BPEConfig {
  vocabSize: number;
}

export interface MergeStep {
  pair: [number, number];
  frequency: number;
  newTokenId: number;
  tokensBefore: number;
  tokensAfter: number;
}

export interface BPETokenizer {
  vocab: Map<number, Uint8Array>;
  merges: Array<[number, number]>;
  mergeSteps: MergeStep[];
  encode(text: string): number[];
  decode(tokens: number[]): string;
  encodeWithSteps(text: string, numMerges?: number): {
    tokens: number[];
    steps: Array<{ tokens: number[]; mergedPair?: [number, number] }>;
  };
}

/**
 * Train a BPE tokenizer on the given text corpus.
 * 
 * @param text - Training corpus
 * @param config - Configuration with target vocabulary size
 * @returns Trained tokenizer
 */
export function trainBPE(text: string, config: BPEConfig): BPETokenizer {
  const textBytes = new TextEncoder().encode(text);
  
  // Initialize vocabulary: start with all individual bytes (0-255)
  const vocab = new Map<number, Uint8Array>();
  for (let i = 0; i < 256; i++) {
    vocab.set(i, new Uint8Array([i]));
  }
  
  // Convert text to initial token sequence (one token per byte)
  let tokens = Array.from(textBytes);
  
  const merges: Array<[number, number]> = [];
  const mergeSteps: MergeStep[] = [];
  
  // Number of merges = vocabSize - 256 (we start with 256 byte tokens)
  const numMerges = Math.max(0, config.vocabSize - 256);
  
  for (let mergeIdx = 0; mergeIdx < numMerges; mergeIdx++) {
    // Count all adjacent token pairs
    const pairCounts = new Map<string, number>();
    
    for (let i = 0; i < tokens.length - 1; i++) {
      const pair = `${tokens[i]},${tokens[i + 1]}`;
      pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
    }
    
    if (pairCounts.size === 0) break;
    
    // Find the most frequent pair
    let maxPair: [number, number] | null = null;
    let maxCount = 0;
    
    for (const [pairStr, count] of pairCounts.entries()) {
      if (count > maxCount) {
        const [a, b] = pairStr.split(',').map(Number);
        maxPair = [a, b];
        maxCount = count;
      }
    }
    
    if (!maxPair || maxCount === 0) break;
    
    // Create new token for this pair
    const newTokenId = 256 + mergeIdx;
    const [a, b] = maxPair;
    
    // The new token's byte sequence is the concatenation of the pair
    const aBytes = vocab.get(a)!;
    const bBytes = vocab.get(b)!;
    const newBytes = new Uint8Array(aBytes.length + bBytes.length);
    newBytes.set(aBytes, 0);
    newBytes.set(bBytes, aBytes.length);
    vocab.set(newTokenId, newBytes);
    
    merges.push(maxPair);
    
    // Replace all occurrences of the pair with the new token
    const tokensBefore = tokens.length;
    const newTokens: number[] = [];
    let i = 0;
    while (i < tokens.length) {
      if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
        newTokens.push(newTokenId);
        i += 2;
      } else {
        newTokens.push(tokens[i]);
        i += 1;
      }
    }
    tokens = newTokens;
    
    mergeSteps.push({
      pair: maxPair,
      frequency: maxCount,
      newTokenId,
      tokensBefore,
      tokensAfter: tokens.length,
    });
  }
  
  return {
    vocab,
    merges,
    mergeSteps,
    encode: (text: string) => encode(text, merges),
    decode: (tokens: number[]) => decode(tokens, vocab),
    encodeWithSteps: (text: string, numMerges?: number) => 
      encodeWithSteps(text, merges, numMerges),
  };
}

/**
 * Encode text into tokens using the trained merges.
 */
function encode(text: string, merges: Array<[number, number]>): number[] {
  const textBytes = new TextEncoder().encode(text);
  let tokens = Array.from(textBytes);
  
  // Apply each merge in order
  for (let mergeIdx = 0; mergeIdx < merges.length; mergeIdx++) {
    const [a, b] = merges[mergeIdx];
    const newTokenId = 256 + mergeIdx;
    
    const newTokens: number[] = [];
    let i = 0;
    while (i < tokens.length) {
      if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
        newTokens.push(newTokenId);
        i += 2;
      } else {
        newTokens.push(tokens[i]);
        i += 1;
      }
    }
    tokens = newTokens;
  }
  
  return tokens;
}

/**
 * Encode text with step-by-step merge visualization.
 */
function encodeWithSteps(
  text: string,
  merges: Array<[number, number]>,
  maxMerges?: number
): {
  tokens: number[];
  steps: Array<{ tokens: number[]; mergedPair?: [number, number] }>;
} {
  const textBytes = new TextEncoder().encode(text);
  let tokens = Array.from(textBytes);
  
  const steps: Array<{ tokens: number[]; mergedPair?: [number, number] }> = [
    { tokens: [...tokens] },
  ];
  
  const mergesToApply = maxMerges !== undefined ? Math.min(maxMerges, merges.length) : merges.length;
  
  for (let mergeIdx = 0; mergeIdx < mergesToApply; mergeIdx++) {
    const [a, b] = merges[mergeIdx];
    const newTokenId = 256 + mergeIdx;
    
    const newTokens: number[] = [];
    let i = 0;
    let merged = false;
    while (i < tokens.length) {
      if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
        newTokens.push(newTokenId);
        merged = true;
        i += 2;
      } else {
        newTokens.push(tokens[i]);
        i += 1;
      }
    }
    tokens = newTokens;
    
    if (merged) {
      steps.push({ tokens: [...tokens], mergedPair: [a, b] });
    }
  }
  
  return { tokens, steps };
}

/**
 * Decode tokens back into text.
 */
function decode(tokens: number[], vocab: Map<number, Uint8Array>): string {
  const bytes: number[] = [];
  
  for (const token of tokens) {
    const tokenBytes = vocab.get(token);
    if (tokenBytes) {
      bytes.push(...Array.from(tokenBytes));
    }
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Get a human-readable representation of a token.
 */
export function tokenToString(tokenId: number, vocab: Map<number, Uint8Array>): string {
  const bytes = vocab.get(tokenId);
  if (!bytes) return `[${tokenId}]`;
  
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Show printable characters as-is, escape others
    if (text.match(/^[\x20-\x7E]+$/)) {
      return text;
    }
    return text;
  } catch {
    // If not valid UTF-8, show hex
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
  }
}
