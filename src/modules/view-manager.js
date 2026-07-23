// src/modules/view-manager.js

/**
 * View Manager
 * Handles side-by-side or top-and-bottom split views, and line number toggling.
 * Interacts with the CSS split-view attributes.
 */

export class ViewManager {
  constructor(progBlockElement) {
    this.element = progBlockElement;
  }

  setSplitView(mode) {
    const validModes = ['none', 'side-by-side', 'top-bottom'];
    if (validModes.includes(mode)) {
      this.element.setAttribute('split-view', mode);
    }
  }

  toggleLineNumbers() {
    if (this.element.hasAttribute('line-numbers')) {
      this.element.removeAttribute('line-numbers');
    } else {
      this.element.setAttribute('line-numbers', '');
    }
  }

  // Example for injecting a live linter panel via a Language Server Proxy
  attachLinterPanel(serverUrl) {
    let linterPanel = this.element.shadowRoot.querySelector('.linter-panel');
    if (!linterPanel) {
      linterPanel = document.createElement('div');
      linterPanel.className = 'linter-panel';
      this.element.shadowRoot.querySelector('.container').appendChild(linterPanel);
    }
    this.setSplitView('side-by-side');

    if (serverUrl) {
      linterPanel.innerHTML = 'Connecting to LSP...';
      const ws = new WebSocket(serverUrl);
      ws.onmessage = (event) => {
        // parse diagnostics and render them
        linterPanel.innerHTML = `<pre>${event.data}</pre>`;
      };
      ws.onclose = () => {
        linterPanel.innerHTML += '\\n[LSP Disconnected]';
      };
      // Keep a reference to close later if needed
      this.lspSocket = ws;
    } else {
      linterPanel.innerHTML = '<i>Linter ready (No LSP proxy provided)</i>';
    }
  }
}
