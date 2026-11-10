/**
 * Small training corpus for the BPE tokenizer.
 * Includes diverse text: English, code, numbers, special characters.
 */

export const TRAINING_CORPUS = `
The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.
Hello world! Hello world! Hello world!
Artificial intelligence and machine learning are transforming technology.
Python is a popular programming language. JavaScript is widely used for web development.
function helloWorld() { console.log("Hello, World!"); }
let x = 42; const y = 3.14159; var z = "test";
for (let i = 0; i < 10; i++) { sum += i; }
1234567890 1234567890 1234567890
The weather is beautiful today. The weather is nice and sunny.
Machine learning models are trained on large datasets.
Tokenization splits text into smaller units called tokens.
Common words: the, is, and, to, a, in, that, it, was, for, on, are, with, as, be
Programming: function, class, return, import, export, const, let, var, if, else, while, for
`;

/**
 * Pre-defined example texts to showcase different tokenization behaviors.
 */
export const EXAMPLES = {
  english: "The quick brown fox jumps over the lazy dog.",
  hindi: "नमस्ते दुनिया! कैसे हो?",
  gujarati: "નમસ્તે! તમે કેમ છો?",
  code: 'function greet(name) { return `Hello, ${name}!`; }',
  numbers: "123456789 0.123 1,000,000 3.14159",
  emoji: "Hello 👋 World 🌍! I love coding 💻 and AI 🤖",
  misspelled: "Thiss sentance has speling mistakess in it.",
};
