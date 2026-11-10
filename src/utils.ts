/**
 * Utility functions for the tokenizer playground.
 */

/**
 * Generate a consistent color for a token ID.
 */
export function getTokenColor(tokenId: number): string {
  const hue = (tokenId * 137.508) % 360;
  const saturation = 70;
  const lightness = tokenId < 256 ? 85 : 75;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Format a token for display, showing special characters clearly.
 */
export function formatTokenDisplay(text: string): string {
  if (!text) return '∅';
  
  const replacements: Record<string, string> = {
    ' ': '·',
    '\n': '↵',
    '\t': '→',
  };
  
  let result = '';
  for (const char of text) {
    result += replacements[char] || char;
  }
  
  return result;
}

/**
 * Estimate cost per 1M tokens for a given price per 1M tokens.
 */
export function estimateCost(tokenCount: number, pricePerMillion: number): string {
  const cost = (tokenCount / 1_000_000) * pricePerMillion;
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}
