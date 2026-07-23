// src/modules/exporter.js

/**
 * ProgBlocks Exporter
 * Supports 1-click export of block data to Nickel, JSON, CSV, or TXT.
 */

export function exportBlockData(content, format = 'txt') {
  let output = content;
  let mimeType = 'text/plain';
  let extension = 'txt';

  switch (format.toLowerCase()) {
    case 'json':
      try {
        // Attempt to parse and re-stringify if it's already JSON-like
        // Or wrap it in a JSON structure if it's plain text.
        output = JSON.stringify({ block_content: content }, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } catch (e) {
        console.error('Failed to export as JSON', e);
      }
      break;

    case 'nickel':
    case 'ncl':
      // Wrap content in a Nickel string or record
      output = `{\n  block_content = m%"\n${content}\n"%\n}`;
      mimeType = 'text/plain'; // or application/x-nickel if standard exists
      extension = 'ncl';
      break;

    case 'csv':
      // Basic CSV heuristic: split lines and commas
      output = content.split('\n')
        .map(line => `"${line.replace(/"/g, '""')}"`)
        .join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
      break;

    case 'txt':
    default:
      output = content;
      mimeType = 'text/plain';
      extension = 'txt';
      break;
  }

  downloadString(output, mimeType, `progblock-export.${extension}`);
}

function downloadString(text, fileType, fileName) {
  const blob = new Blob([text], { type: fileType });
  const a = document.createElement('a');
  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
