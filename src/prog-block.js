// SPDX-License-Identifier: MPL-2.0
// src/prog-block.js — the <prog-block> custom element.
//
// Rendering model: the shadow tree is built ONCE with DOM APIs, then patched
// in place. Author content and reader-entered values only ever reach the page
// through `textContent` — never `innerHTML` — so a code example cannot inject
// markup, and an <input> is never destroyed while someone is typing into it.

const VAR_PATTERN = /\{\{\s*([\w:-]+)\s*(?:=\s*([^}]*?)\s*)?\}\}/g;
const STYLESHEET_URL = new URL('./prog-block.css', import.meta.url).href;

/** Blocks sharing a `group` attribute switch variant together. */
const groups = new Map();
let instanceCount = 0;

/**
 * Strips leading/trailing blank lines and the common indentation from an
 * author's template text, so examples can be indented to match the host HTML.
 */
export function dedent(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const indents = lines
    .filter((line) => line.trim() !== '')
    .map((line) => line.match(/^[ \t]*/)[0].length);
  const common = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(common)).join('\n');
}

/**
 * Splits example source into plain-text and variable segments. A variable is
 * `{{ name }}` or `{{ name = default }}`.
 */
export function tokenize(source) {
  const segments = [];
  let last = 0;
  for (const match of source.matchAll(VAR_PATTERN)) {
    if (match.index > last) segments.push({ text: source.slice(last, match.index) });
    segments.push({ name: match[1], fallback: match[2] ?? null, raw: match[0] });
    last = match.index + match[0].length;
  }
  if (last < source.length) segments.push({ text: source.slice(last) });
  return segments;
}

/**
 * Creates an element with optional attributes and text content. Attribute
 * values and text are set through DOM properties, never parsed as markup.
 */
function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** The <prog-block> element: variant-aware, personalisable code example. */
export class ProgBlock extends HTMLElement {
  /** Attributes whose changes are applied after first render. */
  static get observedAttributes() {
    return ['language', 'line-numbers', 'variant', 'group'];
  }

  /** Sets up empty state and the shadow root; the DOM is built on connect. */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._uid = `pb${++instanceCount}`;
    this._variants = [];
    this._activeIndex = 0;
    this._values = new Map();
    this._defaults = new Map();
    this._built = false;
  }

  /** Reads the authored light DOM and builds the shadow tree on first connect. */
  connectedCallback() {
    if (!this._built) {
      this._readLightDom();
      this._build();
      this._built = true;
      const initial = this.getAttribute('variant');
      if (initial !== null) this._selectByName(initial, { notify: false });
      this._renderVariant();
    }
    this._joinGroup(this.getAttribute('group'));
  }

  /** Leaves any variant-sync group so detached blocks are not retained. */
  disconnectedCallback() {
    this._leaveGroup();
  }

  /** Applies observed attribute changes as in-place DOM patches. */
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._built || oldValue === newValue) return;
    if (name === 'variant' && newValue !== null) this._selectByName(newValue, { notify: false });
    if (name === 'line-numbers') this._renderLineNumbers();
    if (name === 'language') this._renderLanguage();
    if (name === 'group') {
      this._leaveGroup();
      this._joinGroup(newValue);
    }
  }

  /** The active variant's name. Setting it switches variant without moving focus. */
  get variant() {
    return this._variants[this._activeIndex]?.name ?? null;
  }

  /** Selects the variant with this name, if present. */
  set variant(name) {
    this._selectByName(String(name), { notify: false });
  }

  /** The example text exactly as the reader currently sees it. */
  get text() {
    return this._resolve(this._variants[this._activeIndex]?.segments ?? []);
  }

  /** Returns a variable's current value (its default if the reader set none). */
  getVariable(name) {
    return this._values.get(name) || this._defaults.get(name) || '';
  }

  /** Sets a variable's value, updating the input and every occurrence in the code. */
  setVariable(name, value) {
    if (!this._defaults.has(name)) return;
    this._values.set(name, String(value));
    const input = this._varInputs.get(name);
    if (input && input.value !== String(value)) input.value = String(value);
    this._renderValues(name);
    this._renderLineNumbers();
    this.dispatchEvent(new CustomEvent('progblocks:variable-change', {
      bubbles: true,
      composed: true,
      detail: { name, value: String(value) },
    }));
  }

  // --- light DOM ---------------------------------------------------------

  /** Collects variants from `<template data-variant>` children, or the element's own text. */
  _readLightDom() {
    const templates = Array.from(this.querySelectorAll(':scope > template[data-variant]'));
    const sources = templates.length
      ? templates.map((t) => ({ name: t.getAttribute('data-variant') || 'Example', source: t.content.textContent }))
      : [{ name: null, source: this.textContent }];

    this._variants = sources.map(({ name, source }) => ({ name, segments: tokenize(dedent(source)) }));
    for (const { segments } of this._variants) {
      for (const seg of segments) {
        if (seg.name && (!this._defaults.has(seg.name) || (!this._defaults.get(seg.name) && seg.fallback))) {
          this._defaults.set(seg.name, seg.fallback ?? '');
        }
      }
    }
  }

  // --- build (once) ------------------------------------------------------

  /** Builds the entire shadow tree. Called exactly once per element. */
  _build() {
    const root = this.shadowRoot;
    root.append(el('link', { rel: 'stylesheet', href: STYLESHEET_URL }));

    const header = el('div', { class: 'header', part: 'header' });
    this._tabs = [];
    if (this._variants.length > 1) {
      const tablist = el('div', { class: 'tabs', role: 'tablist', 'aria-label': this.getAttribute('label') || 'Example variants' });
      this._variants.forEach((variant, i) => {
        const tab = el('button', {
          type: 'button',
          class: 'tab',
          role: 'tab',
          part: 'tab',
          id: `${this._uid}-tab-${i}`,
          'aria-controls': `${this._uid}-panel`,
        }, variant.name);
        tab.addEventListener('click', () => this._select(i, { focus: false }));
        tab.addEventListener('keydown', (e) => this._onTabKey(e, i));
        tablist.append(tab);
        this._tabs.push(tab);
      });
      header.append(tablist);
    } else {
      this._languageLabel = el('span', { class: 'language' });
      header.append(this._languageLabel);
    }

    this._copyButton = el('button', { type: 'button', class: 'copy', part: 'copy-button' }, 'Copy');
    this._copyButton.addEventListener('click', () => this._copy());
    header.append(this._copyButton);
    root.append(header);

    this._varInputs = new Map();
    if (this._defaults.size > 0) {
      const fieldset = el('fieldset', { class: 'vars', part: 'variables' });
      fieldset.append(el('legend', { class: 'sr-only' }, 'Customise this example'));
      for (const [name, fallback] of this._defaults) {
        const id = `${this._uid}-var-${name}`;
        const wrap = el('div', { class: 'var' });
        const input = el('input', { type: 'text', id, spellcheck: 'false', autocomplete: 'off' });
        input.placeholder = fallback || name;
        input.addEventListener('input', () => this.setVariable(name, input.value));
        wrap.append(el('label', { for: id }, name), input);
        fieldset.append(wrap);
        this._varInputs.set(name, input);
      }
      root.append(fieldset);
    }

    const body = el('div', { class: 'body' });
    this._gutter = el('div', { class: 'line-numbers', 'aria-hidden': 'true' });
    this._panel = el('pre', { class: 'code', part: 'code', id: `${this._uid}-panel`, tabindex: '0' });
    if (this._tabs.length) this._panel.setAttribute('role', 'tabpanel');
    else this._panel.setAttribute('aria-label', 'Code example');
    this._code = el('code');
    this._panel.append(this._code);
    body.append(this._gutter, this._panel);
    root.append(body);

    this._status = el('div', { class: 'sr-only', role: 'status' });
    root.append(this._status);

    this._renderLanguage();
  }

  // --- in-place patches --------------------------------------------------

  /** Replaces the code panel's content with the active variant. */
  _renderVariant() {
    const variant = this._variants[this._activeIndex];
    this._tabs.forEach((tab, i) => {
      const selected = i === this._activeIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    if (this._tabs.length) this._panel.setAttribute('aria-labelledby', this._tabs[this._activeIndex].id);

    this._varNodes = new Map();
    const nodes = variant.segments.map((seg) => {
      if (!seg.name) return document.createTextNode(seg.text);
      const span = el('span', { class: 'var-value', part: 'variable', 'data-var': seg.name });
      if (!this._varNodes.has(seg.name)) this._varNodes.set(seg.name, []);
      this._varNodes.get(seg.name).push(span);
      return span;
    });
    this._code.replaceChildren(...nodes);
    for (const name of this._varNodes.keys()) this._renderValues(name);
    this._renderLineNumbers();
  }

  /** Updates every occurrence of one variable in the visible code. */
  _renderValues(name) {
    const value = this._values.get(name) || this._defaults.get(name);
    for (const span of this._varNodes.get(name) ?? []) {
      span.textContent = value || `{{ ${name} }}`;
      span.classList.toggle('unset', !value);
    }
  }

  /** Shows or hides the line-number gutter, matching the active variant's line count. */
  _renderLineNumbers() {
    const show = this.hasAttribute('line-numbers');
    this._gutter.hidden = !show;
    if (!show) return;
    const count = this.text.split('\n').length;
    if (this._gutter.childElementCount === count) return;
    this._gutter.replaceChildren(...Array.from({ length: count }, (_, i) => el('span', {}, String(i + 1))));
  }

  /** Mirrors the `language` attribute onto the label and a `language-*` class on <code>. */
  _renderLanguage() {
    const language = this.getAttribute('language') || '';
    this._code.className = language ? `language-${language.replace(/[^\w-]/g, '')}` : '';
    if (this._languageLabel) this._languageLabel.textContent = language;
  }

  // --- behaviour ---------------------------------------------------------

  /** Substitutes current values into a variant's segments. */
  _resolve(segments) {
    return segments.map((seg) => (seg.name ? (this._values.get(seg.name) || this._defaults.get(seg.name) || seg.raw) : seg.text)).join('');
  }

  /** Activates variant `index`; optionally moves focus and notifies listeners and the group. */
  _select(index, { focus = false, notify = true } = {}) {
    if (index < 0 || index >= this._variants.length) return;
    const changed = index !== this._activeIndex;
    this._activeIndex = index;
    if (changed) this._renderVariant();
    if (focus) this._tabs[index]?.focus();
    if (changed && notify) {
      this.dispatchEvent(new CustomEvent('progblocks:variant-change', {
        bubbles: true,
        composed: true,
        detail: { variant: this.variant },
      }));
      this._syncGroup();
    }
  }

  /** Activates the variant with the given name, if this block has one. */
  _selectByName(name, options) {
    const index = this._variants.findIndex((v) => v.name === name);
    if (index !== -1) this._select(index, options);
  }

  /** WAI-ARIA tabs keyboard pattern: arrows, Home and End, with automatic activation. */
  _onTabKey(event, index) {
    const last = this._tabs.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    this._select(target, { focus: true });
  }

  /** Copies the personalised example to the clipboard and announces the outcome. */
  async _copy() {
    try {
      await navigator.clipboard.writeText(this.text);
      this._announce('Copied to clipboard');
    } catch {
      this._announce('Copy failed. Select the code and copy it manually.');
    }
  }

  /** Writes a message to the polite live region (cleared first so repeats are re-read). */
  _announce(message) {
    this._status.textContent = '';
    this._status.textContent = message;
  }

  // --- variant groups ----------------------------------------------------

  /** Registers this block in a named sync group. */
  _joinGroup(name) {
    if (!name) return;
    this._group = name;
    if (!groups.has(name)) groups.set(name, new Set());
    groups.get(name).add(this);
  }

  /** Removes this block from its sync group. */
  _leaveGroup() {
    if (!this._group) return;
    groups.get(this._group)?.delete(this);
    this._group = null;
  }

  /** Switches every other block in this block's group to the same variant name. */
  _syncGroup() {
    if (!this._group) return;
    for (const peer of groups.get(this._group) ?? []) {
      if (peer !== this) peer._selectByName(this.variant, { notify: false });
    }
  }
}

if (!customElements.get('prog-block')) customElements.define('prog-block', ProgBlock);
