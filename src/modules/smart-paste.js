// src/modules/smart-paste.js

/**
 * Smart Paste Parsing
 * Intelligently maps paste buffers into target formats (plain text, formatted, arrays, matrices).
 */

export function parsePaste(clipboardEvent) {
  const clipboardData = clipboardEvent.clipboardData || window.clipboardData;
  if (!clipboardData) return { handled: false };

  const pastedText = clipboardData.getData('text/plain');
  
  if (!pastedText) return { handled: false };

  // Detect basic Arrays (e.g. "[1, 2, 3]")
  if (pastedText.trim().startsWith('[') && pastedText.trim().endsWith(']')) {
    try {
      const arr = JSON.parse(pastedText);
      if (Array.isArray(arr)) {
        return {
          handled: true,
          type: 'array',
          content: JSON.stringify(arr, null, 2)
        };
      }
    } catch (e) {
      // Not valid JSON array, fallback
    }
  }

  // Detect CSV / Matrix data (multiple lines with commas/tabs)
  const lines = pastedText.split('\n');
  if (lines.length > 1) {
    const isCsv = lines.every(line => line.includes(',') || line.trim() === '');
    const isTsv = lines.every(line => line.includes('\t') || line.trim() === '');
    
    if (isCsv || isTsv) {
      return {
        handled: true,
        type: 'matrix',
        content: pastedText // in real app, might format into markdown table or structured A2ML
      };
    }
  }

  // Fallback to plain text
  return {
    handled: true,
    type: 'text',
    content: pastedText
  };
}
