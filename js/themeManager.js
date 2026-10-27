/**
 * Theme Manager Module
 * Handles dark/light mode functionality
 *
 * The theme is the saved choice if the user made one, otherwise the operating system's setting (which
 * is followed as it changes). Only an explicit choice is saved, and saving is best-effort: browsers
 * can block storage (privacy modes, sandboxed frames) and that must never stop the calculator.
 * index.html also applies the saved/system theme from a small inline script before first paint.
 */

// Namespaced so that other apps on the same origin (e.g. user.github.io) cannot clash with it
const STORAGE_KEY = 'le-prix-de-respirer:theme';

export class ThemeManager {
    constructor() {
        this.elements = this.initializeElements();
        this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
        this.initTheme();
        this.setupEventListeners();
    }

    /**
     * Initialize DOM element references
     * @returns {Object} Object containing theme-related DOM elements
     */
    initializeElements() {
        return {
            themeToggle: document.getElementById('theme-toggle')
        };
    }

    /**
     * Read the theme the user chose earlier
     * @returns {string|null} 'dark', 'light', or null when nothing usable is saved or storage is blocked
     */
    getSavedTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === 'dark' || saved === 'light' ? saved : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save the user's choice (best effort)
     * @param {string} theme - Theme to save ('dark' or 'light')
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            // Storage is blocked or full: the choice still applies until the page is closed
        }
    }

    /**
     * Initialize theme based on saved preference or system preference
     */
    initTheme() {
        this.applyTheme(this.getSavedTheme() || (this.systemTheme.matches ? 'dark' : 'light'));
    }

    /**
     * Set up event listeners for the theme toggle and for operating system changes
     */
    setupEventListeners() {
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Follow the operating system until the user picks a theme themselves
        this.systemTheme.addEventListener('change', (event) => {
            if (!this.getSavedTheme()) {
                this.applyTheme(event.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Show a theme without saving it (the toggle's icon follows the .dark class in CSS)
     * @param {string} theme - Theme to show ('dark' or 'light')
     */
    applyTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        if (this.elements.themeToggle) {
            this.elements.themeToggle.setAttribute('aria-pressed', String(isDark));
        }
    }

    /**
     * Set dark mode
     */
    setDarkMode() {
        this.setTheme('dark');
    }

    /**
     * Set light mode
     */
    setLightMode() {
        this.setTheme('light');
    }

    /**
     * Toggle between dark and light modes
     */
    toggleTheme() {
        this.setTheme(this.getCurrentTheme() === 'dark' ? 'light' : 'dark');
    }

    /**
     * Get current theme
     * @returns {string} Current theme ('dark' or 'light')
     */
    getCurrentTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    /**
     * Set specific theme as the user's choice (shown now and remembered)
     * @param {string} theme - Theme to set ('dark' or 'light')
     */
    setTheme(theme) {
        const chosen = theme === 'dark' ? 'dark' : 'light';
        this.applyTheme(chosen);
        this.saveTheme(chosen);
    }
}