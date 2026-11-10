import { describe, it, expect } from 'vitest';
import { trainBPE, tokenToString } from './bpe';

describe('BPE Tokenizer', () => {
  it('should train on simple repeated text', () => {
    const text = 'aaabdaaabac';
    const tokenizer = trainBPE(text, { vocabSize: 259 });
    
    expect(tokenizer.vocab.size).toBeGreaterThanOrEqual(256);
    expect(tokenizer.merges.length).toBeGreaterThan(0);
  });
  
  it('should encode and decode correctly (round trip)', () => {
    const text = 'Hello, World! This is a test.';
    const tokenizer = trainBPE(text + text + text, { vocabSize: 280 });
    
    const encoded = tokenizer.encode(text);
    const decoded = tokenizer.decode(encoded);
    
    expect(decoded).toBe(text);
  });
  
  it('should reduce token count after training', () => {
    const text = 'the the the cat cat dog dog dog';
    const tokenizer = trainBPE(text, { vocabSize: 270 });
    
    const encoded = tokenizer.encode(text);
    const byteLength = new TextEncoder().encode(text).length;
    
    expect(encoded.length).toBeLessThan(byteLength);
  });
  
  it('should handle empty text', () => {
    const tokenizer = trainBPE('test', { vocabSize: 260 });
    
    const encoded = tokenizer.encode('');
    const decoded = tokenizer.decode(encoded);
    
    expect(encoded).toEqual([]);
    expect(decoded).toBe('');
  });
  
  it('should handle single character', () => {
    const text = 'aaaaaa';
    const tokenizer = trainBPE(text, { vocabSize: 260 });
    
    const encoded = tokenizer.encode('a');
    const decoded = tokenizer.decode(encoded);
    
    expect(decoded).toBe('a');
  });
  
  it('should preserve Unicode correctly', () => {
    const text = 'Hello 👋 World 🌍';
    const tokenizer = trainBPE(text + text + text, { vocabSize: 280 });
    
    const encoded = tokenizer.encode(text);
    const decoded = tokenizer.decode(encoded);
    
    expect(decoded).toBe(text);
  });
  
  it('should generate merge steps', () => {
    const text = 'aaabbbccc';
    const tokenizer = trainBPE(text, { vocabSize: 270 });
    
    expect(tokenizer.mergeSteps.length).toBeGreaterThan(0);
    tokenizer.mergeSteps.forEach(step => {
      expect(step.pair).toHaveLength(2);
      expect(step.frequency).toBeGreaterThan(0);
      expect(step.tokensAfter).toBeLessThanOrEqual(step.tokensBefore);
    });
  });
  
  it('should support partial merge application', () => {
    const text = 'aaabbbccc';
    const tokenizer = trainBPE(text, { vocabSize: 270 });
    
    const fullEncode = tokenizer.encode(text);
    const partialEncode = tokenizer.encodeWithSteps(text, 2);
    
    expect(partialEncode.steps.length).toBeGreaterThan(0);
    expect(partialEncode.tokens.length).toBeGreaterThanOrEqual(fullEncode.length);
  });
  
  it('should create valid vocabulary entries', () => {
    const text = 'hello world';
    const tokenizer = trainBPE(text, { vocabSize: 270 });
    
    for (const [tokenId, bytes] of tokenizer.vocab.entries()) {
      expect(tokenId).toBeGreaterThanOrEqual(0);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    }
  });
  
  it('should handle tokenToString for basic ASCII', () => {
    const text = 'test';
    const tokenizer = trainBPE(text, { vocabSize: 260 });
    
    const str = tokenToString(116, tokenizer.vocab); // 't'
    expect(str).toBe('t');
  });
});
