import { DOM } from '../utils/DOM.js';

/**
 * ConsoleController - Manages console output
 */
export class ConsoleController {
    constructor() {
        this.output = DOM.query('#console-output');
        this.clearBtn = DOM.query('#btn-clear-console');
        this.copyBtn = DOM.query('#btn-copy-console');
        this.lines = [];

        this.setupEvents();
    }

    /**
     * Setup console events
     */
    setupEvents() {
        this.clearBtn.addEventListener('click', () => this.clear());
        this.copyBtn.addEventListener('click', () => this.copy());
    }

    /**
     * Add output line
     */
    addOutput(output) {
        if (Array.isArray(output)) {
            output.forEach(line => this.addLine(line, 'log'));
        } else {
            this.addLine(output, 'log');
        }
    }

    /**
     * Add a single line
     */
    addLine(text, type = 'log') {
        const line = DOM.create('div', { className: 'console-line' });

        const prefix = DOM.create('div', { className: 'console-prefix', text: '>' });
        const content = DOM.create('div', { className: `console-text console-${type}` });

        // Format the output properly
        if (typeof text === 'string') {
            content.textContent = text;
        } else {
            content.textContent = JSON.stringify(text, null, 2);
        }

        line.appendChild(prefix);
        line.appendChild(content);
        this.output.appendChild(line);
        this.lines.push(text);

        // Auto-scroll to bottom
        this.output.scrollTop = this.output.scrollHeight;
    }

    /**
     * Add error message
     */
    addError(message) {
        const line = DOM.create('div', { className: 'console-line' });

        const prefix = DOM.create('div', { className: 'console-prefix', text: '✗' });
        const content = DOM.create('div', { className: 'console-text console-error' });
        content.textContent = message;

        line.appendChild(prefix);
        line.appendChild(content);
        this.output.appendChild(line);
        this.lines.push(message);

        // Auto-scroll to bottom
        this.output.scrollTop = this.output.scrollHeight;
    }

    /**
     * Add warning message
     */
    addWarning(message) {
        this.addLine(message, 'warn');
    }

    /**
     * Add info message
     */
    addInfo(message) {
        this.addLine(message, 'info');
    }

    /**
     * Clear console
     */
    clear() {
        DOM.clear(this.output);
        this.lines = [];
    }

    /**
     * Copy console contents
     */
    copy() {
        const text = this.lines.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            // Show success feedback
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }
}
