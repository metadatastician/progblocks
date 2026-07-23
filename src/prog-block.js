// src/prog-block.js
import { parseA2ML } from './a2ml-parser.js';
import { validateK9 } from './k9-validator.js';
import { exportBlockData } from './modules/exporter.js';
import { parsePaste } from './modules/smart-paste.js';

export class ProgBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Internal state that drives the UI
    this._state = {
      variants: [], // Array of { id, name, content }
      activeVariantId: null,
      variables: new Map(), // Map of A2ML variables { key: value }
      language: this.getAttribute('language') || 'plaintext',
      showLineNumbers: this.hasAttribute('line-numbers'),
      splitView: this.getAttribute('split-view') || 'none',
      linterEnabled: false,
      lspSocket: null,
      linterHtml: '<i>Linter ready</i>'
    };
  }

  connectedCallback() {
    this.parseLightDOM();
    this.render();
  }

  static get observedAttributes() {
    return ['language', 'line-numbers', 'split-view', 'glyph-mode'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'line-numbers') {
        this.updateState({ showLineNumbers: newValue !== null });
      } else if (name === 'glyph-mode') {
        if (newValue !== null) this.setAttribute('glyph-mode', '');
      } else if (name === 'split-view') {
        this.updateState({ splitView: newValue });
      } else {
        this.updateState({ [name]: newValue });
      }
    }
  }

  updateState(newState) {
    this._state = { ...this._state, ...newState };
    this.render();
  }

  // Reads the light DOM to find `<template>` tags for OS/Shell variants
  parseLightDOM() {
    const templates = Array.from(this.querySelectorAll('template[data-variant]'));
    if (templates.length > 0) {
      const variants = templates.map((t, i) => ({
        id: `var-${i}`,
        name: t.getAttribute('data-variant'),
        content: t.innerHTML.trim()
      }));
      this._state.variants = variants;
      this._state.activeVariantId = variants[0].id;
      this.extractA2MLVariables(variants[0].content);
    } else {
      // Fallback to raw textContent if no templates provided
      const content = this.innerHTML.trim();
      this._state.variants = [{ id: 'default', name: 'Default', content }];
      this._state.activeVariantId = 'default';
      this.extractA2MLVariables(content);
    }
  }

  // Pre-scan for variables like {{ font-size }} to build the UI panel
  extractA2MLVariables(content) {
    const regex = /\{\{\s*([\w:-]+)\s*\}\}/g;
    let match;
    const newVars = new Map(this._state.variables);
    while ((match = regex.exec(content)) !== null) {
      if (!newVars.has(match[1])) {
        newVars.set(match[1], ''); // Default empty
      }
    }
    this._state.variables = newVars;
  }

  // Replaces variables in content
  interpolateContent(content) {
    return content.replace(/\{\{\s*([\w:-]+)\s*\}\}/g, (match, key) => {
      return this._state.variables.get(key) || match;
    });
  }

  handleVarChange(key, value) {
    const newVars = new Map(this._state.variables);
    newVars.set(key, value);
    this.updateState({ variables: newVars });
  }

  handleTabClick(variantId) {
    const variant = this._state.variants.find(v => v.id === variantId);
    if (variant) {
      this.extractA2MLVariables(variant.content);
      this.updateState({ activeVariantId: variantId });
    }
  }

  handleExport() {
    const select = this.shadowRoot.querySelector('#export-format');
    const format = select ? select.value : 'json';
    const content = this.shadowRoot.querySelector('.code-content').textContent;
    exportBlockData(content, format);
  }

  toggleLinter() {
    this.updateState({ 
      linterEnabled: !this._state.linterEnabled,
      splitView: !this._state.linterEnabled ? 'side-by-side' : 'none'
    });
  }

  handlePaste(e) {
    const parsed = parsePaste(e);
    if (parsed.handled) {
      e.preventDefault();
      const codeArea = this.shadowRoot.querySelector('.code-content');
      codeArea.textContent = parsed.content;
      // Update the active variant source to match what was pasted
      const variantIndex = this._state.variants.findIndex(v => v.id === this._state.activeVariantId);
      if (variantIndex > -1) {
        this._state.variants[variantIndex].content = parsed.content;
      }
    }
  }

  render() {
    const activeVariant = this._state.variants.find(v => v.id === this._state.activeVariantId) || { content: '' };
    const interpolatedContent = this.interpolateContent(activeVariant.content);
    const contentLines = interpolatedContent.split('\n');
    
    const lineNumbersHtml = this._state.showLineNumbers ? 
      `<div class="line-numbers" aria-hidden="true">
        ${contentLines.map((_, i) => `<div>${i + 1}</div>`).join('')}
      </div>` : '';

    const tabsHtml = this._state.variants.length > 1 ? `
      <div class="tabs" role="tablist" aria-label="Code variants">
        ${this._state.variants.map(v => `
          <button class="tab ${v.id === this._state.activeVariantId ? 'active' : ''}" 
                  role="tab" 
                  aria-selected="${v.id === this._state.activeVariantId}"
                  data-id="${v.id}">
            ${v.name}
          </button>
        `).join('')}
      </div>
    ` : `<div class="tabs"><span class="tab active">${this._state.language}</span></div>`;

    const varsHtml = this._state.variables.size > 0 ? `
      <div class="a2ml-panel">
        ${Array.from(this._state.variables.entries()).map(([key, val]) => `
          <div class="a2ml-var">
            <label for="var-${key}">${key}:</label>
            <input type="text" id="var-${key}" data-key="${key}" value="${val}" placeholder="value...">
          </div>
        `).join('')}
      </div>
    ` : '';

    const linterHtml = this._state.linterEnabled ? `
      <div class="linter-panel">
        ${this._state.linterHtml}
      </div>
    ` : '';

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./src/prog-block.css">
      <div class="container" split-view="${this._state.splitView}">
        <div class="main-view">
          <header class="header">
            ${tabsHtml}
            <div class="controls">
              <button class="linter-btn" aria-pressed="${this._state.linterEnabled}">Linter</button>
              <select id="export-format" aria-label="Export format">
                <option value="json">JSON</option>
                <option value="txt">Plain Text</option>
                <option value="csv">CSV</option>
                <option value="nickel">Nickel</option>
              </select>
              <button class="export-btn" aria-label="Export code block">Export</button>
            </div>
          </header>
          
          ${varsHtml}
          
          <div class="content-area">
            ${lineNumbersHtml}
            <div class="code-content" contenteditable="true" aria-label="Code editor" role="textbox" aria-multiline="true">${interpolatedContent}</div>
          </div>
        </div>
        
        ${linterHtml}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Tabs
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => this.handleTabClick(e.target.getAttribute('data-id')));
    });

    // Variable inputs
    const inputs = this.shadowRoot.querySelectorAll('.a2ml-var input');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => this.handleVarChange(e.target.getAttribute('data-key'), e.target.value));
    });

    // Controls
    const exportBtn = this.shadowRoot.querySelector('.export-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.handleExport());

    const linterBtn = this.shadowRoot.querySelector('.linter-btn');
    if (linterBtn) linterBtn.addEventListener('click', () => this.toggleLinter());

    // Editor
    const codeArea = this.shadowRoot.querySelector('.code-content');
    if (codeArea) {
      codeArea.addEventListener('paste', (e) => this.handlePaste(e));
      codeArea.addEventListener('input', (e) => {
        // Simple internal sync if user types
        const variantIndex = this._state.variants.findIndex(v => v.id === this._state.activeVariantId);
        if (variantIndex > -1) {
          // Careful: if A2ML vars exist, typing over them destroys the template tag!
          // For a true WYSIWYG A2ML editor, we need a deeper syncing layer.
          this._state.variants[variantIndex].content = e.target.textContent;
        }
      });
    }
  }
}

customElements.define('prog-block', ProgBlock);
