/**
 * Wrapper for tiktoken to handle initialization and encoding.
 */

import { Tiktoken } from 'js-tiktoken/lite';
import cl100k_base from 'js-tiktoken/ranks/cl100k_base';

let tiktoken: Tiktoken | null = null;

export function getTiktoken(): Tiktoken {
  if (!tiktoken) {
    tiktoken = new Tiktoken(cl100k_base);
  }
  return tiktoken;
}

export function encodeTiktoken(text: string): number[] {
  try {
    const tk = getTiktoken();
    return Array.from(tk.encode(text));
  } catch (error) {
    console.error('Tiktoken encoding error:', error);
    return [];
  }
}
