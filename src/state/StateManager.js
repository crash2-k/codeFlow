import { EventEmitter } from '../utils/EventEmitter.js';

/**
 * StateManager - Central application state management
 */
export class StateManager {
    constructor() {
        this.events = new EventEmitter();
        
        this.state = {
            // Editor state
            editor: {
                code: '',
                cursorPosition: 0,
                breakpoints: new Set(), // Set of line numbers with breakpoints
                isDirty: false
            },

            // Execution state
            execution: {
                status: 'idle', // 'idle', 'running', 'paused', 'finished', 'error'
                currentStep: 0,
                history: [], // Array of execution states
                speed: 1, // Execution speed multiplier
                isAutoRunning: false
            },

            // Debugger state
            debugger: {
                callStack: [],
                scopes: [], // Array of scope objects with variables
                breakpointPaused: false,
                pausedAtLine: null
            },

            // Visualization state
            visualization: {
                mode: 'execution', // 'execution', 'memory', 'structures', 'async'
                camera: {
                    x: 0,
                    y: 0,
                    zoom: 1
                }
            },

            // Settings
            settings: {
                theme: 'dark', // 'dark', 'light', 'system'
                fontSize: 13,
                tabSize: 4,
                showLineNumbers: true,
                showAnimations: true,
                autoSave: true
            },

            // Projects
            projects: {
                current: null,
                list: []
            }
        };
    }

    /**
     * Subscribe to state changes
     */
    subscribe(eventName, callback) {
        return this.events.on(eventName, callback);
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Get specific state slice
     */
    get(path) {
        const keys = path.split('.');
        let value = this.state;
        for (const key of keys) {
            value = value[key];
            if (value === undefined) return undefined;
        }
        return value;
    }

    /**
     * Set state at path and emit event
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        let current = this.state;
        for (const key of keys) {
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
        this.events.emit(`state:${path}`, value);
        this.events.emit('state:changed', { path, value });
    }

    /**
     * Update nested state
     */
    update(path, updates) {
        const current = this.get(path);
        if (typeof current === 'object' && current !== null) {
            const updated = { ...current, ...updates };
            this.set(path, updated);
        }
    }

    /**
     * Add execution history state
     */
    addExecutionState(state) {
        this.state.execution.history.push(state);
        this.events.emit('execution:stateAdded', state);
    }

    /**
     * Clear execution history
     */
    clearExecutionHistory() {
        this.state.execution.history = [];
        this.state.execution.currentStep = 0;
        this.events.emit('execution:historyCleared');
    }

    /**
     * Add breakpoint
     */
    addBreakpoint(lineNumber) {
        this.state.editor.breakpoints.add(lineNumber);
        this.events.emit('breakpoint:added', lineNumber);
    }

    /**
     * Remove breakpoint
     */
    removeBreakpoint(lineNumber) {
        this.state.editor.breakpoints.delete(lineNumber);
        this.events.emit('breakpoint:removed', lineNumber);
    }

    /**
     * Toggle breakpoint
     */
    toggleBreakpoint(lineNumber) {
        if (this.state.editor.breakpoints.has(lineNumber)) {
            this.removeBreakpoint(lineNumber);
        } else {
            this.addBreakpoint(lineNumber);
        }
    }

    /**
     * Check if line has breakpoint
     */
    hasBreakpoint(lineNumber) {
        return this.state.editor.breakpoints.has(lineNumber);
    }

    /**
     * Reset to initial state (keep code and breakpoints)
     */
    reset() {
        this.state.execution.status = 'idle';
        this.state.execution.currentStep = 0;
        this.state.execution.isAutoRunning = false;
        this.state.execution.history = [];
        
        this.state.debugger.callStack = [];
        this.state.debugger.scopes = [];
        this.state.debugger.breakpointPaused = false;
        this.state.debugger.pausedAtLine = null;

        this.events.emit('execution:reset');
    }

    /**
     * Register event listener (alias for subscribe)
     */
    on(eventName, callback) {
        return this.events.on(eventName, callback);
    }

    /**
     * Emit event
     */
    emit(eventName, data) {
        this.events.emit(eventName, data);
    }
}

// Export singleton instance
export const stateManager = new StateManager();
