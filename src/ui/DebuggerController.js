import { DOM } from '../utils/DOM.js';
import { stateManager } from '../state/StateManager.js';

/**
 * DebuggerController - Manages the debugger panel
 */
export class DebuggerController {
    constructor() {
        this.callStackContainer = DOM.query('#call-stack');
        this.variablesPanel = DOM.query('#variables-panel');
        this.timeline = DOM.query('#timeline');
        this.expandedVariables = new Set();
    }

    /**
     * Update call stack display
     */
    updateCallStack(callStack) {
        DOM.clear(this.callStackContainer);

        if (!callStack || callStack.length === 0) {
            this.callStackContainer.innerHTML = '<div class="placeholder">No execution</div>';
            return;
        }

        callStack.forEach((frame, index) => {
            const frameEl = DOM.create('div', {
                className: index === 0 ? 'call-stack-frame current' : 'call-stack-frame'
            });

            const name = DOM.create('div', {
                className: 'frame-name',
                text: frame.functionName || 'main'
            });

            const location = DOM.create('div', {
                className: 'frame-location',
                text: frame.location || ''
            });

            frameEl.appendChild(name);
            frameEl.appendChild(location);
            this.callStackContainer.appendChild(frameEl);
        });
    }

    /**
     * Update variables display
     */
    updateVariables(globalScope, callStack) {
        DOM.clear(this.variablesPanel);

        // Display local scope from current function
        if (callStack && callStack.length > 0) {
            const localScope = callStack[0].variables;
            if (Object.keys(localScope).length > 0) {
                const section = DOM.create('div');
                const title = DOM.create('div', {
                    className: 'section-title',
                    text: 'Local Variables'
                });
                section.appendChild(title);

                for (const [name, value] of Object.entries(localScope)) {
                    const varItem = this.createVariableItem(name, value);
                    section.appendChild(varItem);
                }

                this.variablesPanel.appendChild(section);
            }
        }

        // Display global scope
        if (Object.keys(globalScope).length > 0) {
            const section = DOM.create('div');
            const title = DOM.create('div', {
                className: 'section-title',
                text: 'Global Scope'
            });
            section.appendChild(title);

            for (const [name, value] of Object.entries(globalScope)) {
                if (name !== 'this' && !name.startsWith('__')) {
                    const varItem = this.createVariableItem(name, value);
                    section.appendChild(varItem);
                }
            }

            this.variablesPanel.appendChild(section);
        }

        if (this.variablesPanel.children.length === 0) {
            this.variablesPanel.innerHTML = '<div class="placeholder">No variables</div>';
        }
    }

    /**
     * Create a variable item element
     */
    createVariableItem(name, value) {
        const item = DOM.create('div', { className: 'variable-item' });

        const nameEl = DOM.create('div', {
            className: 'variable-name',
            text: name
        });

        const valueEl = DOM.create('div', {
            className: 'variable-value',
            text: this.formatValue(value)
        });

        item.appendChild(nameEl);
        item.appendChild(valueEl);

        // Make expandable if complex type
        if (this.isComplexType(value)) {
            item.addEventListener('click', () => {
                this.expandVariable(name, value, item);
            });
            item.style.cursor = 'pointer';
        }

        return item;
    }

    /**
     * Check if value is complex type
     */
    isComplexType(value) {
        return value && (typeof value === 'object' || value.startsWith('[') || value.startsWith('{'));
    }

    /**
     * Format value for display
     */
    formatValue(value) {
        if (typeof value === 'string') {
            return value.length > 50 ? value.substring(0, 50) + '...' : value;
        }
        return value;
    }

    /**
     * Expand/collapse a variable
     */
    expandVariable(name, value, element) {
        const id = `var-${name}`;
        if (this.expandedVariables.has(id)) {
            this.expandedVariables.delete(id);
            const nested = element.nextElementSibling;
            if (nested && nested.id === id) {
                nested.remove();
            }
        } else {
            this.expandedVariables.add(id);
            // Parse value and show nested content
            const nested = DOM.create('div', { id: id, className: 'nested-variables' });
            // Add parsing logic here for complex types
            element.insertAdjacentElement('afterend', nested);
        }
    }

    /**
     * Update timeline
     */
    updateTimeline(history, currentStep) {
        DOM.clear(this.timeline);

        if (!history || history.length === 0) {
            this.timeline.innerHTML = '<div class="placeholder">No execution</div>';
            return;
        }

        history.forEach((state, index) => {
            const step = DOM.create('div', {
                className: index === currentStep ? 'timeline-step active' : 'timeline-step',
                text: index.toString(),
                listeners: {
                    click: () => {
                        stateManager.set('execution.currentStep', index);
                    }
                }
            });

            this.timeline.appendChild(step);
        });

        // Scroll to active step
        const activeStep = this.timeline.querySelector('.timeline-step.active');
        if (activeStep) {
            activeStep.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    /**
     * Clear debugger
     */
    clear() {
        DOM.clear(this.callStackContainer);
        DOM.clear(this.variablesPanel);
        DOM.clear(this.timeline);
        this.expandedVariables.clear();

        this.callStackContainer.innerHTML = '<div class="placeholder">No execution</div>';
        this.variablesPanel.innerHTML = '<div class="placeholder">No variables</div>';
        this.timeline.innerHTML = '<div class="placeholder">No execution</div>';
    }
}
