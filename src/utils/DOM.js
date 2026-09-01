/**
 * DOM - Utility functions for DOM manipulation
 */
export const DOM = {
    /**
     * Query selector shorthand
     */
    query: (selector, parent = document) => {
        return parent.querySelector(selector);
    },

    /**
     * Query selector all shorthand
     */
    queryAll: (selector, parent = document) => {
        return Array.from(parent.querySelectorAll(selector));
    },

    /**
     * Create element with optional attributes and content
     */
    create: (tag, options = {}) => {
        const element = document.createElement(tag);
        
        if (options.id) element.id = options.id;
        if (options.className) element.className = options.className;
        if (options.html) element.innerHTML = options.html;
        if (options.text) element.textContent = options.text;
        
        if (options.attrs) {
            Object.entries(options.attrs).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }

        if (options.styles) {
            Object.entries(options.styles).forEach(([key, value]) => {
                element.style[key] = value;
            });
        }

        if (options.listeners) {
            Object.entries(options.listeners).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        }

        return element;
    },

    /**
     * Clear children of an element
     */
    clear: (element) => {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    /**
     * Add class to element
     */
    addClass: (element, className) => {
        element.classList.add(className);
    },

    /**
     * Remove class from element
     */
    removeClass: (element, className) => {
        element.classList.remove(className);
    },

    /**
     * Toggle class on element
     */
    toggleClass: (element, className) => {
        element.classList.toggle(className);
    },

    /**
     * Check if element has class
     */
    hasClass: (element, className) => {
        return element.classList.contains(className);
    },

    /**
     * Set styles on element
     */
    setStyles: (element, styles) => {
        Object.entries(styles).forEach(([key, value]) => {
            element.style[key] = value;
        });
    },

    /**
     * Set attributes on element
     */
    setAttrs: (element, attrs) => {
        Object.entries(attrs).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    },

    /**
     * On element
     */
    on: (element, event, handler) => {
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    },

    /**
     * Escape HTML special characters
     */
    escape: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
