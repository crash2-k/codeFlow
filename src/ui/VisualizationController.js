import { DOM } from '../utils/DOM.js';

/**
 * VisualizationController - Manages execution visualization
 */
export class VisualizationController {
    constructor() {
        this.container = DOM.query('#visualization-canvas');
        this.modeButtons = DOM.queryAll('.mode-btn');
        this.currentMode = 'execution';

        this.setupModeButtons();
    }

    /**
     * Setup visualization mode buttons
     */
    setupModeButtons() {
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modeButtons.forEach(b => DOM.removeClass(b, 'active'));
                DOM.addClass(btn, 'active');
                this.currentMode = btn.dataset.mode;
                this.renderVisualization();
            });
        });
    }

    /**
     * Update visualization with current state
     */
    update(state) {
        this.currentState = state;
        this.renderVisualization();
    }

    /**
     * Render visualization based on current mode
     */
    renderVisualization() {
        if (!this.currentState) {
            DOM.clear(this.container);
            this.container.innerHTML = '<div class="no-visualization">Run code to visualize</div>';
            return;
        }

        switch (this.currentMode) {
            case 'execution':
                this.renderExecutionView();
                break;
            case 'memory':
                this.renderMemoryView();
                break;
            case 'structures':
                this.renderStructuresView();
                break;
            default:
                this.renderExecutionView();
        }
    }

    /**
     * Render execution view
     */
    renderExecutionView() {
        DOM.clear(this.container);

        const content = DOM.create('div');

        // Display step information
        const stepInfo = DOM.create('div', {
            className: 'step-info',
            styles: {
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '4px',
                marginBottom: '16px',
                fontFamily: 'monospace'
            }
        });

        const stepText = DOM.create('div', {
            text: `Step ${this.currentState.step}: ${this.currentState.description}`,
            styles: { marginBottom: '8px', fontWeight: '600' }
        });

        stepInfo.appendChild(stepText);

        // Display variables
        if (Object.keys(this.currentState.globalScope).length > 0) {
            const varsTitle = DOM.create('div', {
                text: 'Variables:',
                styles: { fontWeight: '600', marginTop: '8px', marginBottom: '4px' }
            });
            stepInfo.appendChild(varsTitle);

            for (const [name, value] of Object.entries(this.currentState.globalScope)) {
                const varLine = DOM.create('div', {
                    text: `  ${name} = ${value}`,
                    styles: { fontSize: '12px', color: 'var(--text-secondary)' }
                });
                stepInfo.appendChild(varLine);
            }
        }

        content.appendChild(stepInfo);
        this.container.appendChild(content);
    }

    /**
     * Render memory view (stack/heap visualization)
     */
    renderMemoryView() {
        DOM.clear(this.container);

        const content = DOM.create('div', {
            styles: {
                padding: '16px'
            }
        });

        const title = DOM.create('div', {
            text: 'Memory Visualization',
            styles: {
                fontWeight: '600',
                marginBottom: '12px'
            }
        });

        const stackSection = DOM.create('div', {
            styles: {
                marginBottom: '16px'
            }
        });

        const stackTitle = DOM.create('div', {
            text: 'Stack',
            styles: {
                fontWeight: '600',
                marginBottom: '8px'
            }
        });

        stackSection.appendChild(stackTitle);

        // Render call stack as memory boxes
        if (this.currentState.callStack && this.currentState.callStack.length > 0) {
            this.currentState.callStack.forEach(frame => {
                const frameBox = this.createMemoryBox(frame.functionName, frame.variables);
                stackSection.appendChild(frameBox);
            });
        }

        content.appendChild(title);
        content.appendChild(stackSection);
        this.container.appendChild(content);
    }

    /**
     * Create a memory box for visualization
     */
    createMemoryBox(title, variables) {
        const box = DOM.create('div', {
            styles: {
                border: '2px solid var(--accent-primary)',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: 'rgba(0, 122, 204, 0.1)'
            }
        });

        const titleEl = DOM.create('div', {
            text: title,
            styles: {
                fontWeight: '600',
                marginBottom: '8px',
                color: 'var(--accent-primary)'
            }
        });

        box.appendChild(titleEl);

        for (const [name, value] of Object.entries(variables)) {
            const varEl = DOM.create('div', {
                text: `${name}: ${value}`,
                styles: {
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                    fontFamily: 'monospace'
                }
            });
            box.appendChild(varEl);
        }

        return box;
    }

    /**
     * Render data structures view
     */
    renderStructuresView() {
        DOM.clear(this.container);

        const content = DOM.create('div', {
            styles: {
                padding: '16px'
            }
        });

        const title = DOM.create('div', {
            text: 'Data Structures',
            styles: {
                fontWeight: '600',
                marginBottom: '16px'
            }
        });

        content.appendChild(title);

        // Render arrays and objects
        for (const [name, value] of Object.entries(this.currentState.globalScope)) {
            if (value.startsWith('[') || value.startsWith('{')) {
                const structBox = DOM.create('div', {
                    styles: {
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '12px',
                        marginBottom: '12px',
                        backgroundColor: 'var(--bg-secondary)'
                    }
                });

                const nameEl = DOM.create('div', {
                    text: name,
                    styles: {
                        fontWeight: '600',
                        marginBottom: '8px'
                    }
                });

                const valueEl = DOM.create('div', {
                    text: value,
                    styles: {
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }
                });

                structBox.appendChild(nameEl);
                structBox.appendChild(valueEl);
                content.appendChild(structBox);
            }
        }

        this.container.appendChild(content);
    }

    /**
     * Clear visualization
     */
    clear() {
        DOM.clear(this.container);
        this.container.innerHTML = '<div class="no-visualization">Run code to visualize</div>';
        this.currentState = null;
    }
}
