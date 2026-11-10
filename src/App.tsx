import { useState, useEffect, useMemo } from 'react';
import { trainBPE, BPETokenizer, tokenToString } from './bpe';
import { TRAINING_CORPUS, EXAMPLES } from './corpus';
import { getTokenColor, formatTokenDisplay, estimateCost } from './utils';
import { encodeTiktoken } from './tiktoken-wrapper';
import './App.css';

function App() {
  const [inputText, setInputText] = useState(EXAMPLES.english);
  const [vocabSize, setVocabSize] = useState(400);
  const [tokenizer, setTokenizer] = useState<BPETokenizer | null>(null);
  const [mergeStep, setMergeStep] = useState<number | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    setIsTraining(true);
    const timer = setTimeout(() => {
      const trained = trainBPE(TRAINING_CORPUS, { vocabSize });
      setTokenizer(trained);
      setIsTraining(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [vocabSize]);

  const encoded = useMemo(() => {
    if (!tokenizer) return null;
    if (mergeStep !== null) {
      return tokenizer.encodeWithSteps(inputText, mergeStep);
    }
    return { tokens: tokenizer.encode(inputText), steps: [] };
  }, [tokenizer, inputText, mergeStep]);

  const tiktokenEncoded = useMemo(() => {
    try {
      return encodeTiktoken(inputText);
    } catch {
      return [];
    }
  }, [inputText]);

  const handleExampleClick = (example: string) => {
    setInputText(example);
    setMergeStep(null);
  };

  if (!tokenizer || isTraining) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
        <p>Training tokenizer...</p>
      </div>
    );
  }

  const maxMerges = tokenizer.merges.length;
  const currentTokens = encoded?.tokens || [];

  return (
    <div className="app">
      <header className="header">
        <h1>🔤 Tokenizer Playground</h1>
        <p className="subtitle">
          See how LLM tokenizers split text using Byte-Pair Encoding (BPE)
        </p>
      </header>

      <main className="main">
        <section className="explainer">
          <h2>What's happening?</h2>
          <p>
            <strong>Tokenization</strong> splits text into smaller units called <strong>tokens</strong>. 
            Large Language Models (LLMs) process tokens, not characters or words.
          </p>
          <p>
            <strong>Byte-Pair Encoding (BPE)</strong> builds a vocabulary by:
          </p>
          <ol>
            <li>Starting with individual bytes (0-255)</li>
            <li>Finding the most common adjacent pair</li>
            <li>Merging that pair into a new token</li>
            <li>Repeating until reaching the target vocabulary size</li>
          </ol>
          <p>
            Common patterns (like "the" or "ing") become single tokens, making processing more efficient.
          </p>
        </section>

        <section className="controls">
          <div className="control-group">
            <label htmlFor="vocab-size">
              Vocabulary Size: <strong>{vocabSize}</strong>
              <span className="control-hint">({vocabSize - 256} merges)</span>
            </label>
            <input
              id="vocab-size"
              type="range"
              min="256"
              max="600"
              step="10"
              value={vocabSize}
              onChange={(e) => {
                setVocabSize(Number(e.target.value));
                setMergeStep(null);
              }}
            />
          </div>
        </section>

        <section className="examples">
          <h3>Quick Examples</h3>
          <div className="example-buttons">
            {Object.entries(EXAMPLES).map(([key, text]) => (
              <button
                key={key}
                onClick={() => handleExampleClick(text)}
                className="example-button"
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <section className="input-section">
          <label htmlFor="input-text">Your Text</label>
          <textarea
            id="input-text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setMergeStep(null);
            }}
            placeholder="Type anything here..."
            rows={4}
          />
        </section>

        <section className="tokens-section">
          <div className="section-header">
            <h3>Tokens</h3>
            <div className="token-count">
              {currentTokens.length} token{currentTokens.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="tokens-display">
            {currentTokens.map((tokenId, idx) => {
              const tokenText = tokenToString(tokenId, tokenizer.vocab);
              return (
                <span
                  key={idx}
                  className="token"
                  style={{ backgroundColor: getTokenColor(tokenId) }}
                  title={`Token ID: ${tokenId}`}
                >
                  {formatTokenDisplay(tokenText)}
                </span>
              );
            })}
          </div>
        </section>

        <section className="merge-section">
          <h3>Step Through Merges</h3>
          <p className="merge-description">
            Watch how tokens merge step by step. Start with {new TextEncoder().encode(inputText).length} bytes, 
            then gradually merge them into {currentTokens.length} tokens.
          </p>
          <div className="merge-controls">
            <label htmlFor="merge-slider">
              Merges Applied: <strong>{mergeStep === null ? maxMerges : mergeStep}</strong>
            </label>
            <input
              id="merge-slider"
              type="range"
              min="0"
              max={maxMerges}
              value={mergeStep === null ? maxMerges : mergeStep}
              onChange={(e) => setMergeStep(Number(e.target.value))}
            />
            <button
              className="reset-button"
              onClick={() => setMergeStep(null)}
            >
              Reset to Full
            </button>
          </div>
        </section>

        <section className="comparison-section">
          <h3>Comparison: GPT-4 Tokenizer (cl100k_base)</h3>
          <div className="comparison-grid">
            <div className="comparison-item">
              <div className="comparison-label">Your BPE</div>
              <div className="comparison-value">{currentTokens.length} tokens</div>
            </div>
            <div className="comparison-item">
              <div className="comparison-label">GPT-4 (tiktoken)</div>
              <div className="comparison-value">{tiktokenEncoded.length} tokens</div>
            </div>
          </div>
          <div className="cost-estimate">
            <strong>Cost Estimate (GPT-4 rates):</strong>
            <div className="cost-details">
              <span>Input: {estimateCost(tiktokenEncoded.length, 2.50)} (at $2.50/1M tokens)</span>
              <span>Output: {estimateCost(tiktokenEncoded.length, 10.00)} (at $10.00/1M tokens)</span>
            </div>
            <p className="cost-note">
              Example pricing as of 2024. Actual rates vary by model and provider.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          Built by <strong>Fagun Raithatha</strong> • {' '}
          <a
            href="https://github.com/fagun98/tokenizer-playground"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </p>
        <p className="footer-note">
          BPE implementation from scratch • No API keys required
        </p>
      </footer>
    </div>
  );
}

export default App;
