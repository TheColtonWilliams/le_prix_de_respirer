/**
 * Tab Manager Module
 * Handles tab navigation and content switching
 *
 * Follows the WAI-ARIA tabs pattern: only the selected tab is in the page's tab order, and the
 * Left/Right arrow keys (wrapping), Home and End move between the tabs.
 */

// Tab names in display order. Each name needs a button #<name>-tab and a panel #<name>-content in index.html.
const TAB_NAMES = ['calculator', 'custom-calc', 'state-calc', 'bracket-breakdown'];

export class TabManager {
    constructor() {
        this.tabNames = TAB_NAMES;
        this.activeTab = TAB_NAMES[0];
        this.init();
    }

    /**
     * Initialize tab functionality
     */
    init() {
        this.bindTabEvents();
        this.setActiveTab(this.activeTab); // Default to calculator tab
    }

    /**
     * Bind click and keyboard events to tab buttons
     */
    bindTabEvents() {
        this.tabNames.forEach(tabName => {
            const tabButton = document.getElementById(`${tabName}-tab`);
            if (!tabButton) return;

            tabButton.addEventListener('click', () => this.setActiveTab(tabName));
            tabButton.addEventListener('keydown', (event) => this.handleKeydown(event));
        });
    }

    /**
     * Move between tabs with the arrow keys, Home and End
     * @param {KeyboardEvent} event - Keydown event from a tab button
     */
    handleKeydown(event) {
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        switch (event.key) {
            case 'ArrowRight':
                this.nextTab({ focus: true });
                break;
            case 'ArrowLeft':
                this.previousTab({ focus: true });
                break;
            case 'Home':
                this.setActiveTab(this.tabNames[0], { focus: true });
                break;
            case 'End':
                this.setActiveTab(this.tabNames[this.tabNames.length - 1], { focus: true });
                break;
            default:
                return;
        }
        event.preventDefault();
    }

    /**
     * Set the active tab
     * @param {string} tabName - Name of the tab to activate (one of the names in TAB_NAMES)
     * @param {Object} [options] - Options
     * @param {boolean} [options.focus] - Also move keyboard focus to the tab button (for keyboard navigation)
     */
    setActiveTab(tabName, { focus = false } = {}) {
        const activeTabButton = document.getElementById(`${tabName}-tab`);
        const activeTabContent = document.getElementById(`${tabName}-content`);

        // Check before changing anything, so a wrong name cannot leave the page with no visible panel
        if (!this.tabNames.includes(tabName) || !activeTabButton || !activeTabContent) {
            console.warn(`Unknown tab: ${tabName}`);
            return;
        }

        this.tabNames.forEach(name => {
            const isActive = name === tabName;
            const tabButton = document.getElementById(`${name}-tab`);
            const tabContent = document.getElementById(`${name}-content`);

            if (tabButton) {
                tabButton.classList.toggle('active', isActive);
                tabButton.setAttribute('aria-selected', String(isActive));
                tabButton.tabIndex = isActive ? 0 : -1;
            }
            if (tabContent) {
                tabContent.classList.toggle('active', isActive);
            }
        });
            
        this.activeTab = tabName;

        if (focus) {
            activeTabButton.focus();
        }

        // Trigger a custom event for other modules to listen to
        document.dispatchEvent(new CustomEvent('tabChanged', {
            detail: { activeTab: tabName }
        }));
    }

    /**
     * Get the currently active tab
     * @returns {string} Name of the active tab
     */
    getActiveTab() {
        return this.activeTab;
    }

    /**
     * Switch to next tab (wraps around)
     * @param {Object} [options] - Same options as setActiveTab
     */
    nextTab(options) {
        this.moveBy(1, options);
    }

    /**
     * Switch to previous tab (wraps around)
     * @param {Object} [options] - Same options as setActiveTab
     */
    previousTab(options) {
        this.moveBy(-1, options);
    }

    /**
     * Switch to the tab a number of places away from the active one
     * @param {number} step - Number of places to move (negative moves left)
     * @param {Object} [options] - Same options as setActiveTab
     */
    moveBy(step, options) {
        const count = this.tabNames.length;
        const index = this.tabNames.indexOf(this.activeTab);
        this.setActiveTab(this.tabNames[(index + step + count) % count], options);
    }
}