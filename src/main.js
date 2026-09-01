import { stateManager } from './state/StateManager.js';
import { DOM } from './utils/DOM.js';
import { SimpleParser } from './parser/SimpleParser.js';
import { ExecutionEngine } from './execution/ExecutionEngine.js';
import { EditorController } from './ui/EditorController.js';
import { DebuggerController } from './ui/DebuggerController.js';
import { ConsoleController } from './ui/ConsoleController.js';
import { VisualizationController } from './ui/VisualizationController.js';
import { EXAMPLES } from './examples/Examples.js';

/**
 * ApplicationController - Main application orchestration
 */
export class ApplicationController {
    constructor() {
        this.editor = null;
        this.debugger = null;
        this.console = null;
        this.visualization = null;
        this.isRunning = false;
        this.autoRunTimer = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('CodeFlow initializing...');

        // Initialize controllers
        this.editor = new EditorController();
        this.debugger = new DebuggerController();
        this.console = new ConsoleController();
        this.visualization = new VisualizationController();

        // Setup event listeners
        this.setupToolbarEvents();
        this.setupEditorEvents();
        this.setupStateEvents();
        this.setupKeyboardShortcuts();

        // Load saved state
        this.loadState();

        console.log('CodeFlow ready');
    }

    /**
     * Setup toolbar button events
     */
    setupToolbarEvents() {
        const runBtn = DOM.query('#btn-run');
        const pauseBtn = DOM.query('#btn-pause');
        const stepForwardBtn = DOM.query('#btn-step-forward');
        const stepBackwardBtn = DOM.query('#btn-step-backward');
        const resetBtn = DOM.query('#btn-reset');
        const examplesBtn = DOM.query('#btn-examples');
        const themeBtn = DOM.query('#btn-theme');
        const settingsBtn = DOM.query('#btn-settings');
        const speedSlider = DOM.query('#speed-slider');
        const speedDisplay = DOM.query('#speed-display');

        // Close modal buttons
        const closeExamplesBtn = DOM.query('#close-examples-modal');
        const closeSettingsBtn = DOM.query('#close-settings-modal');

        runBtn.addEventListener('click', () => this.run());
        pauseBtn.addEventListener('click', () => this.pause());
        stepForwardBtn.addEventListener('click', () => this.stepForward());
        stepBackwardBtn.addEventListener('click', () => this.stepBackward());
        resetBtn.addEventListener('click', () => this.reset());

        examplesBtn.addEventListener('click', () => this.showExamplesModal());
        themeBtn.addEventListener('click', () => this.toggleTheme());
        settingsBtn.addEventListener('click', () => this.showSettingsModal());

        if (closeExamplesBtn) {
            closeExamplesBtn.addEventListener('click', () => {
                DOM.addClass(DOM.query('#examples-modal'), 'hidden');
            });
        }

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                DOM.addClass(DOM.query('#settings-modal'), 'hidden');
            });
        }

        speedSlider.addEventListener('change', (e) => {
            stateManager.set('execution.speed', parseFloat(e.target.value));
            speedDisplay.textContent = `${e.target.value}x`;
        });
    }

    /**
     * Setup editor events
     */
    setupEditorEvents() {
        stateManager.subscribe('editor.code', (code) => {
            stateManager.set('editor.isDirty', true);
            this.saveState();
        });
    }

    /**
     * Setup state change events
     */
    setupStateEvents() {
        stateManager.subscribe('state:execution.status', (status) => {
            this.updateToolbarState(status);
        });

        stateManager.subscribe('state:execution.currentStep', (step) => {
            this.updateDebuggerForStep(step);
        });

        stateManager.subscribe('breakpoint:added', (line) => {
            this.editor.updateLineNumbers();
        });

        stateManager.subscribe('breakpoint:removed', (line) => {
            this.editor.updateLineNumbers();
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter: Run
            if ((e.ctrlKey || e.metaKey) && e.code === 'Enter') {
                e.preventDefault();
                this.run();
            }
            // F10: Step Forward
            if (e.key === 'F10') {
                e.preventDefault();
                this.stepForward();
            }
            // Shift + F10: Step Backward
            if (e.shiftKey && e.key === 'F10') {
                e.preventDefault();
                this.stepBackward();
            }
            // F8: Continue
            if (e.key === 'F8') {
                e.preventDefault();
                this.pause();
            }
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
                e.preventDefault();
                this.saveState();
                this.showNotification('Code saved', 'success');
            }
            // Ctrl/Cmd + K: Clear Console
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
                e.preventDefault();
                this.console.clear();
            }
            // Escape: Close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Run the code
     */
    async run() {
        const code = stateManager.get('editor.code');
        if (!code.trim()) {
            this.showNotification('Please enter some code', 'warning');
            return;
        }

        stateManager.set('execution.status', 'running');
        stateManager.reset();

        try {
            // Parse the code
            const parser = new SimpleParser(code);
            const parseResult = parser.parse();

            if (parseResult.error) {
                this.handleParseError(parseResult.error);
                return;
            }

            // Execute the code
            const engine = new ExecutionEngine(parseResult.ast, parseResult.functions);
            const executionResult = engine.execute();

            if (!executionResult.success) {
                this.handleRuntimeError(executionResult.error);
                return;
            }

            // Store execution history
            for (const state of executionResult.states) {
                stateManager.addExecutionState(state);
            }

            // Display output
            this.console.addOutput(executionResult.output);

            // Update UI to show first step
            stateManager.set('execution.currentStep', 0);
            stateManager.set('execution.status', 'paused');

            this.updateDebuggerForStep(0);
            this.updateVisualization();

        } catch (error) {
            console.error('Execution error:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
            stateManager.set('execution.status', 'error');
        }
    }

    /**
     * Pause execution
     */
    pause() {
        if (this.autoRunTimer) {
            clearTimeout(this.autoRunTimer);
            this.autoRunTimer = null;
        }
        stateManager.set('execution.isAutoRunning', false);
        stateManager.set('execution.status', 'paused');
    }

    /**
     * Step forward
     */
    stepForward() {
        const history = stateManager.get('execution.history');
        const currentStep = stateManager.get('execution.currentStep');

        if (currentStep < history.length - 1) {
            const nextStep = currentStep + 1;
            stateManager.set('execution.currentStep', nextStep);
            this.updateDebuggerForStep(nextStep);
            this.updateVisualization();
        }
    }

    /**
     * Step backward
     */
    stepBackward() {
        const currentStep = stateManager.get('execution.currentStep');

        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            stateManager.set('execution.currentStep', prevStep);
            this.updateDebuggerForStep(prevStep);
            this.updateVisualization();
        }
    }

    /**
     * Reset execution
     */
    reset() {
        stateManager.reset();
        this.debugger.clear();
        this.console.clear();
        this.visualization.clear();
        this.pause();
    }

    /**
     * Update debugger for current step
     */
    updateDebuggerForStep(stepIndex) {
        const history = stateManager.get('execution.history');
        if (stepIndex >= 0 && stepIndex < history.length) {
            const state = history[stepIndex];
            this.debugger.updateCallStack(state.callStack);
            this.debugger.updateVariables(state.globalScope, state.callStack);
            this.debugger.updateTimeline(history, stepIndex);
            this.console.addOutput(state.output);
            this.editor.setCurrentLine(state.currentLine || null);
        }
    }

    /**
     * Update visualization
     */
    updateVisualization() {
        const stepIndex = stateManager.get('execution.currentStep');
        const history = stateManager.get('execution.history');
        if (stepIndex >= 0 && stepIndex < history.length) {
            const state = history[stepIndex];
            this.visualization.update(state);
        }
    }

    /**
     * Update toolbar state based on execution status
     */
    updateToolbarState(status) {
        const runBtn = DOM.query('#btn-run');
        const pauseBtn = DOM.query('#btn-pause');

        switch (status) {
            case 'running':
                runBtn.disabled = true;
                pauseBtn.disabled = false;
                break;
            case 'paused':
            case 'finished':
            case 'idle':
                runBtn.disabled = false;
                pauseBtn.disabled = true;
                break;
            case 'error':
                runBtn.disabled = false;
                pauseBtn.disabled = true;
                break;
        }
    }

    /**
     * Handle parse error
     */
    handleParseError(error) {
        stateManager.set('execution.status', 'error');
        const errorMsg = `Syntax Error (Line ${error.line}, Column ${error.column}): ${error.message}`;
        this.console.addError(errorMsg);
        this.showNotification(errorMsg, 'error');
        this.editor.highlightError(error.line);
    }

    /**
     * Handle runtime error
     */
    handleRuntimeError(error) {
        stateManager.set('execution.status', 'error');
        const errorMsg = `Runtime Error: ${error.message}`;
        this.console.addError(errorMsg);
        this.showNotification(errorMsg, 'error');
    }

    /**
     * Show examples modal
     */
    showExamplesModal() {
        const modal = DOM.query('#examples-modal');
        const list = DOM.query('#examples-list');
        DOM.clear(list);

        EXAMPLES.forEach(example => {
            const item = DOM.create('div', {
                className: 'example-item',
                listeners: {
                    click: () => {
                        stateManager.set('editor.code', example.code);
                        this.editor.updateCode(example.code);
                        DOM.addClass(modal, 'hidden');
                    }
                }
            });

            const name = DOM.create('div', { className: 'example-name', text: example.name });
            const desc = DOM.create('div', { className: 'example-description', text: example.description });

            item.appendChild(name);
            item.appendChild(desc);
            list.appendChild(item);
        });

        DOM.removeClass(modal, 'hidden');
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        const modal = DOM.query('#settings-modal');
        DOM.removeClass(modal, 'hidden');
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = DOM.queryAll('.modal');
        modals.forEach(modal => DOM.addClass(modal, 'hidden'));
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = stateManager.get('settings.theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        if (newTheme === 'light') {
            html.classList.add('light-theme');
        } else {
            html.classList.remove('light-theme');
        }

        stateManager.set('settings.theme', newTheme);
        this.saveState();
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'error') {
        const notif = DOM.query('#error-notification');
        notif.textContent = message;
        notif.className = `notification ${type}`;
        DOM.removeClass(notif, 'hidden');

        setTimeout(() => {
            DOM.addClass(notif, 'hidden');
        }, 3000);
    }

    /**
     * Save application state
     */
    saveState() {
        const state = {
            code: stateManager.get('editor.code'),
            theme: stateManager.get('settings.theme'),
            breakpoints: Array.from(stateManager.get('editor.breakpoints'))
        };
        localStorage.setItem('codeflow-state', JSON.stringify(state));
    }

    /**
     * Load application state
     */
    loadState() {
        const saved = localStorage.getItem('codeflow-state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.code) {
                    stateManager.set('editor.code', state.code);
                    this.editor.updateCode(state.code);
                }
                if (state.theme) {
                    stateManager.set('settings.theme', state.theme);
                    if (state.theme === 'light') {
                        document.documentElement.classList.add('light-theme');
                    }
                }
                if (state.breakpoints) {
                    state.breakpoints.forEach(line => stateManager.addBreakpoint(line));
                }
            } catch (error) {
                console.error('Error loading state:', error);
            }
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new ApplicationController();
        app.init();
    });
} else {
    const app = new ApplicationController();
    app.init();
}
