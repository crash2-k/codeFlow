import { stateManager } from '../state/StateManager.js';
import { DOM } from '../utils/DOM.js';

/**
 * EditorController - Manages the code editor
 */
export class EditorController {
    constructor() {
        this.textarea = DOM.query('#code-editor');
        this.lineNumbersContainer = DOM.query('#line-numbers');
        this.currentLine = null;

        this.setupEditor();
    }

    /**
     * Setup editor events
     */
    setupEditor() {
        this.textarea.addEventListener('input', (e) => {
            stateManager.set('editor.code', e.target.value);
            this.updateLineNumbers();
        });

        this.textarea.addEventListener('keydown', (e) => {
            // Handle Tab key
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.textarea.selectionStart;
                const end = this.textarea.selectionEnd;
                const code = this.textarea.value;
                const tabSize = stateManager.get('settings.tabSize') || 4;
                const tab = ' '.repeat(tabSize);

                this.textarea.value = code.substring(0, start) + tab + code.substring(end);
                this.textarea.selectionStart = this.textarea.selectionEnd = start + tabSize;
                stateManager.set('editor.code', this.textarea.value);
                this.updateLineNumbers();
            }

            // Handle Ctrl+Enter to run
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                // Run will be handled by main controller
            }
        });

        // Setup line number clicking for breakpoints
        this.lineNumbersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('line-number')) {
                const lineNum = parseInt(e.target.dataset.line);
                stateManager.toggleBreakpoint(lineNum);
                this.updateLineNumbers();
            }
        });

        // Initial update
        this.updateLineNumbers();
    }

    /**
     * Update line numbers display
     */
    updateLineNumbers() {
        const lines = this.textarea.value.split('\n').length;
        DOM.clear(this.lineNumbersContainer);

        for (let i = 1; i <= lines; i++) {
            const lineNum = DOM.create('div', {
                className: 'line-number',
                text: i.toString(),
                attrs: { 'data-line': i }
            });

            if (stateManager.hasBreakpoint(i)) {
                lineNum.textContent = '● ' + i;
            }

            if (i === this.currentLine) {
                DOM.addClass(lineNum, 'executing');
            }

            this.lineNumbersContainer.appendChild(lineNum);
        }
    }

    /**
     * Set current executing line
     */
    setCurrentLine(lineNumber) {
        this.currentLine = lineNumber;
        this.updateLineNumbers();
    }

    /**
     * Update editor code
     */
    updateCode(code) {
        this.textarea.value = code;
        stateManager.set('editor.code', code);
        this.updateLineNumbers();
    }

    /**
     * Highlight error
     */
    highlightError(lineNumber) {
        // This can be extended to highlight errors visually
        this.setCurrentLine(lineNumber);
    }

    /**
     * Clear the editor
     */
    clear() {
        this.textarea.value = '';
        stateManager.set('editor.code', '');
        this.currentLine = null;
        this.updateLineNumbers();
    }
}
