// src/prog-block.js
import { parseA2ML } from './a2ml-parser.js';
import { validateK9 } from './k9-validator.js';
import { exportBlockData } from './modules/exporter.js';
import { parsePaste } from './modules/smart-paste.js';

export class ProgBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._state = {
      language: this.getAttribute('language') || 'plaintext',
      os: this.getAttribute('os') || 'any',
      shell: this.getAttribute('shell') || 'any',
      citation: this.getAttribute('citation') || 'none',
      showLineNumbers: this.hasAttribute('line-numbers'),
      splitView: this.getAttribute('split-view') || 'none'
    };
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  static get observedAttributes() {
    return ['language', 'os', 'shell', 'line-numbers', 'split-view'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'line-numbers') {
        this._state.showLineNumbers = newValue !== null;
      } else {
        this._state[name] = newValue;
      }
      this.render();
    }
  }

  setupListeners() {
    const codeArea = this.shadowRoot.querySelector('.code-content');
    if (codeArea) {
      codeArea.addEventListener('paste', (e) => {
        const parsed = parsePaste(e);
        if (parsed.handled) {
          e.preventDefault();
          codeArea.textContent = parsed.content;
        }
      });
    }

    const exportBtn = this.shadowRoot.querySelector('.export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportBlockData(this.textContent, 'json'); // default test export
      });
    }
  }

  render() {
    // Generate line numbers securely away from selection bounds
    const contentLines = this.textContent.split('\n');
    const lineNumbersHtml = this._state.showLineNumbers ? 
      `<div class="line-numbers" aria-hidden="true">
        ${contentLines.map((_, i) => `<div>${i + 1}</div>`).join('')}
      </div>` : '';

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./src/prog-block.css">
      <div class="container" split-view="${this._state.splitView}">
        <header class="header">
          <div class="badges" aria-label="Block Configuration">
            <span class="badge lang-badge">${this._state.language}</span>
          </div>
          <div class="controls">
            <button class="export-btn" aria-label="Export code block">Export</button>
          </div>
        </header>
        <div class="content-area">
          ${lineNumbersHtml}
          <div class="code-content" contenteditable="true" aria-label="Code editor" role="textbox" aria-multiline="true">
            ${this.innerHTML}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('prog-block', ProgBlock);
