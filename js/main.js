/**
 * Main Calculator Application Module
 * Coordinates all calculator components and manages application state
 */

import { TaxCalculator } from './taxCalculator.js';
import { UIControls } from './uiControls.js';
import { DisplayManager } from './displayManager.js';
import { ThemeManager } from './themeManager.js';
import { TabManager } from './tabManager.js';
import { TAX_YEAR, getStateData, getCountyData } from './jurisdictionData.js';

/**
 * Log every page element a module could not find, once at startup. Without this a renamed or
 * mistyped id would silently leave a number stuck at its default value.
 * @param {string} owner - Name of the module that looked the elements up
 * @param {Object} elements - The module's element references
 */
function reportMissingElements(owner, elements) {
    const missing = Object.entries(elements)
        .filter(([, element]) => !element || (element instanceof NodeList && element.length === 0))
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error(`${owner} could not find these page elements: ${missing.join(', ')}`);
    }
}

export class TaxCalculatorApp {
    constructor() {
        this.taxCalculator = new TaxCalculator();
        this.displayManager = new DisplayManager();
        this.themeManager = new ThemeManager();
        this.tabManager = new TabManager();
        
        // Initialize UI controls with update callback
        this.uiControls = new UIControls(() => this.updateCalculations());
        
        reportMissingElements('DisplayManager', this.displayManager.elements);
        reportMissingElements('UIControls', this.uiControls.elements);

        // Show which tax year the rates and standard deductions are for
        document.querySelectorAll('[data-tax-year]').forEach(element => {
            element.textContent = TAX_YEAR;
        });

        // Listen for tab changes to update bracket breakdown
        document.addEventListener('tabChanged', (e) => {
            if (e.detail.activeTab === 'bracket-breakdown') {
                this.updateBracketBreakdown();
            }
        });
        
        // Perform initial calculations
        this.updateCalculations();

        // Browsers restore form values after load without firing any event (Back without the
        // back/forward cache, session restore), so re-sync and recalculate once the page is shown
        window.addEventListener('pageshow', () => {
            this.uiControls.syncJurisdiction();
            this.updateCalculations();
        });
    }

    /**
     * Update all calculations and displays
     */
    updateCalculations() {
        // Get current input values
        const inputs = this.uiControls.getValues();
        
        // Calculate comprehensive tax scenario with federal, state, and county taxes
        const calculation = this.taxCalculator.calculateAllTaxes(inputs);
        
        // Calculate baseline scenario for federal taxes
        const grossIncome = inputs.federalIncome || 0;
        const baselineCalculation = grossIncome > 0 ? this.taxCalculator.calculateBaseline(grossIncome, inputs.filingStatus) : null;
        
        // Calculate baseline scenario for the selected state and county taxes
        const stateIncome = inputs.stateIncome || 0;
        const stateBaselineCalculation = stateIncome > 0
            ? this.taxCalculator.calculateStateBaseline(stateIncome, inputs.filingStatus, inputs.stateCode, inputs.countyCode)
            : null;

        // Update every label that names the selected state and county
        this.displayManager.updateJurisdiction(
            getStateData(inputs.stateCode),
            getCountyData(inputs.stateCode, inputs.countyCode),
            inputs.filingStatus
        );

        // Update all displays
        this.displayManager.updateAll(calculation, inputs, baselineCalculation, stateBaselineCalculation);
        
        // Update bracket breakdown if that tab is active
        if (this.tabManager.getActiveTab() === 'bracket-breakdown') {
            this.updateBracketBreakdown();
        }
    }

    /**
     * Update bracket breakdown tables
     */
    updateBracketBreakdown() {
        const inputs = this.uiControls.getValues();
        this.displayManager.updateBracketBreakdown(inputs, this.taxCalculator);
    }

    /**
     * Reset calculator to default values
     */
    reset() {
        this.uiControls.reset();
    }

    /**
     * Get current calculator state
     * @returns {Object} Current state including inputs and calculations
     */
    getState() {
        const inputs = this.uiControls.getValues();
        const calculation = this.taxCalculator.calculateAllTaxes(inputs);
        
        return {
            inputs,
            calculation,
            theme: this.themeManager.getCurrentTheme()
        };
    }

    /**
     * Set calculator state
     * @param {Object} state - State to set
     */
    setState(state) {
        if (state.inputs) {
            this.uiControls.setValues(state.inputs);
        }
        if (state.theme) {
            this.themeManager.setTheme(state.theme);
        }
        this.updateCalculations();
    }

    /**
     * Enable all calculator functionality
     */
    enable() {
        this.uiControls.enable();
    }

    /**
     * Disable all calculator functionality
     */
    disable() {
        this.uiControls.disable();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make calculator available globally for debugging/external access
    window.taxCalculatorApp = new TaxCalculatorApp();
});