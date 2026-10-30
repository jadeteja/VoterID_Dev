/**
 * Telugu Unicode and Search Normalization Engine
 * Normalizes Unicode diacritics, strips zero-width non-joiners/joiners,
 * and handles phonetic equivalence mapping for search.
 */

// Range for Telugu Unicode: \u0C00 - \u0C7F
export function isTeluguText(text: string): boolean {
  return /[\u0C00-\u0C7F]/.test(text);
}

/**
 * Normalizes Telugu text for indexing and comparison:
 * 1. NFC normalization
 * 2. Removes zero-width joiner (\u200D) and zero-width non-joiner (\u200C)
 * 3. Normalizes common diacritic variations (halant / virama)
 * 4. Normalizes whitespaces
 */
export function normalizeTeluguText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/[\u200C\u200D\uFEFF]/g, '') // remove invisible zero-width chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes Romanized / English search input
 */
export function normalizeEnglishText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Translates Telugu text to phonetic Romanized English representation.
 * Follows standard Andhra Pradesh electoral and transliteration phonetics.
 */
const TELUGU_TO_ROMAN_MAP: Record<string, string> = {
  // Vowels
  'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo',
  'ఋ': 'ru', 'ౠ': 'roo', 'ఎ': 'e', 'ఏ': 'e', 'ఐ': 'ai', 'ఒ': 'o',
  'ఓ': 'o', 'ఔ': 'au', 'అం': 'am', 'అః': 'aha',

  // Consonants
  'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng',
  'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
  'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n',
  'త': 't', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
  'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
  'య': 'y', 'ర': 'r', 'ఱ': 'r', 'ల': 'l', 'ళ': 'l',
  'వ': 'v', 'శ': 'sh', 'ష': 'sh', 'స': 's', 'హ': 'h',

  // Matras (Vowel signs)
  'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo',
  'ృ': 'ru', 'ౄ': 'roo', 'ె': 'e', 'ే': 'e', 'ై': 'ai',
  'ొ': 'o', 'ో': 'o', 'ౌ': 'au', 'ం': 'm', 'ః': 'h',
  '్': '', // Virama (halant)
};

export function romanizeTelugu(teluguText: string | null | undefined): string {
  if (!teluguText) return '';
  const text = normalizeTeluguText(teluguText);
  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    if (char === ' ') {
      result += ' ';
      continue;
    }

    // Check if consonant
    if (TELUGU_TO_ROMAN_MAP[char]) {
      const rom = TELUGU_TO_ROMAN_MAP[char];

      // If consonant followed by a matra
      if (nextChar && TELUGU_TO_ROMAN_MAP[nextChar] !== undefined && isMatra(nextChar)) {
        result += rom + TELUGU_TO_ROMAN_MAP[nextChar];
        i++; // skip matra
      } else if (nextChar === '్') {
        // Halant (virama): pure consonant, no inherent 'a'
        result += rom;
        i++; // skip virama
      } else if (isConsonant(char)) {
        // Inherent 'a' vowel unless followed by another sign
        result += rom + 'a';
      } else {
        result += rom;
      }
    } else {
      result += char;
    }
  }

  return result.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isConsonant(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0C15 && code <= 0x0C39;
}

function isMatra(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x0C3E && code <= 0x0C4C) || code === 0x0C02 || code === 0x0C03;
}

/**
 * Common Roman spelling variation aliases for English-to-Telugu search matching.
 * e.g., Laxmi -> Lakshmi, Sreenivas -> Srinivas, Krishna -> Krushna
 */
export function getRomanPhoneticVariants(query: string): string[] {
  const q = normalizeEnglishText(query);
  const variants = new Set<string>([q]);

  // Laxmi <-> Lakshmi
  if (q.includes('lax')) variants.add(q.replace(/lax/g, 'laksh'));
  if (q.includes('laksh')) variants.add(q.replace(/laksh/g, 'lax'));

  // ee <-> i
  if (q.includes('ee')) variants.add(q.replace(/ee/g, 'i'));
  if (q.includes('i')) variants.add(q.replace(/i/g, 'ee'));

  // oo <-> u
  if (q.includes('oo')) variants.add(q.replace(/oo/g, 'u'));
  if (q.includes('u')) variants.add(q.replace(/u/g, 'oo'));

  // v <-> w
  if (q.includes('v')) variants.add(q.replace(/v/g, 'w'));
  if (q.includes('w')) variants.add(q.replace(/w/g, 'v'));

  // sh <-> s
  if (q.includes('sh')) variants.add(q.replace(/sh/g, 's'));

  // ch <-> c
  if (q.includes('ch')) variants.add(q.replace(/ch/g, 'c'));

  return Array.from(variants);
}
