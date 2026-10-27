/**
 * Display Manager Module
 * Handles updating all display elements and visualizations for federal, state, and county taxes
 *
 * Note: the 'state-*' / 'county-*' element ids and CSS classes belong to whichever state and county are
 * selected. Their names are shown through the data-state-name / data-county-name spans.
 */

import { filingStatusKey } from './jurisdictionData.js';

export class DisplayManager {
    constructor() {
        this.elements = this.initializeElements();
        // One formatter for every figure: building a new Intl.NumberFormat per call is the slowest part of a render
        this.currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    /**
     * Initialize DOM element references for display elements
     * @returns {Object} Object containing DOM element references
     */
    initializeElements() {
        return {
            // Federal display elements
            federalAgiDisplay: document.getElementById('federal-agi-display'),
            federalTaxableIncomeDisplay: document.getElementById('federal-taxable-income-display'),
            
            // State display elements
            stateAgiDisplay: document.getElementById('state-agi-display'),
            stateTaxableIncomeDisplay: document.getElementById('state-taxable-income-display'),

            // Selected state/county display elements
            countyRateInfo: document.getElementById('county-rate-info'),
            countyBracketNote: document.getElementById('county-bracket-note'),

            // Notes that explain figures (unused amounts, which income the percentages use)
            federalUnusedNote: document.getElementById('federal-unused-note'),
            stateUnusedNote: document.getElementById('state-unused-note'),
            incomeBasisNote: document.getElementById('income-basis-note'),

            // Visualization bar elements
            barTakeHome: document.getElementById('bar-take-home'),
            barFederal: document.getElementById('bar-federal'),
            barState: document.getElementById('bar-state'),
            barCounty: document.getElementById('bar-county'),

            // Percentage display elements
            percentageTakeHome: document.getElementById('percentage-take-home'),
            percentageFederal: document.getElementById('percentage-federal'),
            percentageState: document.getElementById('percentage-state'),
            percentageCounty: document.getElementById('percentage-county'),

            // Tax summary elements
            federalAgiSummary: document.getElementById('federal-agi-summary'),
            federalTaxableSummary: document.getElementById('federal-taxable-summary'),
            federalTaxSummary: document.getElementById('federal-tax-summary'),
            federalRateSummary: document.getElementById('federal-rate-summary'),
            
            stateAgiSummary: document.getElementById('state-agi-summary'),
            stateTaxableSummary: document.getElementById('state-taxable-summary'),
            stateTaxSummary: document.getElementById('state-tax-summary'),
            countyTaxSummary: document.getElementById('county-tax-summary'),
            stateRateSummary: document.getElementById('state-rate-summary'),
            
            totalFederalDisplay: document.getElementById('total-federal-display'),
            totalStateDisplay: document.getElementById('total-state-display'),
            totalCountyDisplay: document.getElementById('total-county-display'),
            totalAllTaxesDisplay: document.getElementById('total-all-taxes-display'),
            totalTakeHomeDisplay: document.getElementById('total-take-home-display'),
            totalEffectiveRateDisplay: document.getElementById('total-effective-rate-display'),

            // Visual calculation elements - Custom
            visualGrossIncome: document.getElementById('visual-gross-income'),
            visualAdjustments: document.getElementById('visual-adjustments'),
            visualAgi: document.getElementById('visual-agi'),
            visualAgi2: document.getElementById('visual-agi-2'),
            visualDeductions: document.getElementById('visual-deductions'),
            visualTaxableIncome: document.getElementById('visual-taxable-income'),
            visualTaxableIncome2: document.getElementById('visual-taxable-income-2'),
            visualTaxRate: document.getElementById('visual-tax-rate'),
            visualPreCreditTax: document.getElementById('visual-pre-credit-tax'),
            visualPreCreditTax2: document.getElementById('visual-pre-credit-tax-2'),
            visualCredits: document.getElementById('visual-credits'),
            visualTotalTax: document.getElementById('visual-total-tax'),
            visualGrossIncome2: document.getElementById('visual-gross-income-2'),
            visualTotalTax2: document.getElementById('visual-total-tax-2'),
            visualTakeHome: document.getElementById('visual-take-home'),
            visualTotalTax3: document.getElementById('visual-total-tax-3'),
            visualGrossIncome3: document.getElementById('visual-gross-income-3'),
            visualEffectiveRate: document.getElementById('visual-effective-rate'),

            // Visual calculation elements - Baseline
            baselineGrossIncome: document.getElementById('baseline-gross-income'),
            baselineAdjustments: document.getElementById('baseline-adjustments'),
            baselineAgi: document.getElementById('baseline-agi'),
            baselineAgi2: document.getElementById('baseline-agi-2'),
            baselineDeductions: document.getElementById('baseline-deductions'),
            baselineTaxableIncome: document.getElementById('baseline-taxable-income'),
            baselineTaxableIncome2: document.getElementById('baseline-taxable-income-2'),
            baselineTaxRate: document.getElementById('baseline-tax-rate'),
            baselinePreCreditTax: document.getElementById('baseline-pre-credit-tax'),
            baselinePreCreditTax2: document.getElementById('baseline-pre-credit-tax-2'),
            baselineCredits: document.getElementById('baseline-credits'),
            baselineTotalTax: document.getElementById('baseline-total-tax'),
            baselineGrossIncome2: document.getElementById('baseline-gross-income-2'),
            baselineTotalTax2: document.getElementById('baseline-total-tax-2'),
            baselineTakeHome: document.getElementById('baseline-take-home'),
            baselineTotalTax3: document.getElementById('baseline-total-tax-3'),
            baselineGrossIncome3: document.getElementById('baseline-gross-income-3'),
            baselineEffectiveRate: document.getElementById('baseline-effective-rate'),

            // State tax tab visual calculation elements - Custom
            stateVisualGrossIncome: document.getElementById('state-visual-gross-income'),
            stateVisualAdjustments: document.getElementById('state-visual-adjustments'),
            stateVisualAgi: document.getElementById('state-visual-agi'),
            stateVisualAgi2: document.getElementById('state-visual-agi-2'),
            stateVisualDeductions: document.getElementById('state-visual-deductions'),
            stateVisualTaxableIncome: document.getElementById('state-visual-taxable-income'),
            stateVisualTaxableIncome2: document.getElementById('state-visual-taxable-income-2'),
            stateVisualTaxableIncome3: document.getElementById('state-visual-taxable-income-3'),
            stateVisualStateTaxRate: document.getElementById('state-visual-state-tax-rate'),
            stateVisualStatePreCreditTax: document.getElementById('state-visual-state-pre-credit-tax'),
            stateVisualCountyTaxRate: document.getElementById('state-visual-county-tax-rate'),
            stateVisualCountyTax: document.getElementById('state-visual-county-tax'),
            stateVisualStatePreCreditTax2: document.getElementById('state-visual-state-pre-credit-tax-2'),
            stateVisualCredits: document.getElementById('state-visual-credits'),
            stateVisualTotalStateTax: document.getElementById('state-visual-total-state-tax'),
            stateVisualTotalStateTax2: document.getElementById('state-visual-total-state-tax-2'),
            stateVisualCountyTax2: document.getElementById('state-visual-county-tax-2'),
            stateVisualCombinedTax: document.getElementById('state-visual-combined-tax'),
            stateVisualGrossIncome2: document.getElementById('state-visual-gross-income-2'),
            stateVisualCombinedTax2: document.getElementById('state-visual-combined-tax-2'),
            stateVisualTakeHome: document.getElementById('state-visual-take-home'),
            stateVisualCombinedTax3: document.getElementById('state-visual-combined-tax-3'),
            stateVisualGrossIncome3: document.getElementById('state-visual-gross-income-3'),
            stateVisualEffectiveRate: document.getElementById('state-visual-effective-rate'),

            // State tax tab visual calculation elements - Baseline
            stateBaselineGrossIncome: document.getElementById('state-baseline-gross-income'),
            stateBaselineAdjustments: document.getElementById('state-baseline-adjustments'),
            stateBaselineAgi: document.getElementById('state-baseline-agi'),
            stateBaselineAgi2: document.getElementById('state-baseline-agi-2'),
            stateBaselineDeductions: document.getElementById('state-baseline-deductions'),
            stateBaselineTaxableIncome: document.getElementById('state-baseline-taxable-income'),
            stateBaselineTaxableIncome2: document.getElementById('state-baseline-taxable-income-2'),
            stateBaselineTaxableIncome3: document.getElementById('state-baseline-taxable-income-3'),
            stateBaselineStateTaxRate: document.getElementById('state-baseline-state-tax-rate'),
            stateBaselineStatePreCreditTax: document.getElementById('state-baseline-state-pre-credit-tax'),
            stateBaselineCountyTaxRate: document.getElementById('state-baseline-county-tax-rate'),
            stateBaselineCountyTax: document.getElementById('state-baseline-county-tax'),
            stateBaselineStatePreCreditTax2: document.getElementById('state-baseline-state-pre-credit-tax-2'),
            stateBaselineCredits: document.getElementById('state-baseline-credits'),
            stateBaselineTotalStateTax: document.getElementById('state-baseline-total-state-tax'),
            stateBaselineTotalStateTax2: document.getElementById('state-baseline-total-state-tax-2'),
            stateBaselineCountyTax2: document.getElementById('state-baseline-county-tax-2'),
            stateBaselineCombinedTax: document.getElementById('state-baseline-combined-tax'),
            stateBaselineGrossIncome2: document.getElementById('state-baseline-gross-income-2'),
            stateBaselineCombinedTax2: document.getElementById('state-baseline-combined-tax-2'),
            stateBaselineTakeHome: document.getElementById('state-baseline-take-home'),
            stateBaselineCombinedTax3: document.getElementById('state-baseline-combined-tax-3'),
            stateBaselineGrossIncome3: document.getElementById('state-baseline-gross-income-3'),
            stateBaselineEffectiveRate: document.getElementById('state-baseline-effective-rate')
        };
    }

    /**
     * Format number as currency
     * @param {number} value - Number to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(value) {
        return this.currencyFormatter.format(value);
    }

    /**
     * Format number as percentage
     * @param {number} value - Number to format
     * @returns {string} Formatted percentage string
     */
    formatPercentage(value) {
        return value.toFixed(2) + '%';
    }

    /**
     * Format a rate as a percentage for descriptive text (e.g. 0.0281 -> "2.81%")
     * @param {number} rate - Rate as a decimal
     * @returns {string} Formatted percentage string
     */
    formatRate(rate) {
        return this.formatPercentage(rate * 100);
    }

    /**
     * Describe a county's local income tax brackets in words
     * @param {Object} state - State data
     * @param {Object} county - County data
     * @param {number} filingStatus - 1 for single, 2 for married
     * @returns {string} Human-readable description of the county's local income tax
     */
    describeCountyTax(state, county, filingStatus) {
        const brackets = county.brackets[filingStatusKey(filingStatus)];

        if (brackets.length === 1) {
            const [[, rate]] = brackets;
            if (rate === 0) {
                return state.countyNote || `${county.name} does not levy a local income tax.`;
            }
            return `${county.name} local income tax: ${this.formatRate(rate)} of ${state.name} taxable income.`;
        }

        const parts = brackets.map(([limit, rate], index) => {
            if (limit === Infinity) {
                return `${this.formatRate(rate)} above ${this.formatCurrency(brackets[index - 1][0])}`;
            }
            if (index === 0) {
                return county.wholeIncome
                    ? `${this.formatRate(rate)} if taxable income is up to ${this.formatCurrency(limit)}`
                    : `${this.formatRate(rate)} on the first ${this.formatCurrency(limit)}`;
            }
            return `${this.formatRate(rate)} up to ${this.formatCurrency(limit)}`;
        });
        const wholeIncomeNote = county.wholeIncome
            ? ' The rate for your bracket applies to all of your taxable income, not just the part in that bracket.'
            : '';
        return `${county.name} local income tax: ${parts.join(', ')}.${wholeIncomeNote}`;
    }

    /**
     * Update every place that names the selected state or county (labels, headings, legend, page title)
     * @param {Object} state - Selected state data
     * @param {Object} county - Selected county data
     * @param {number} filingStatus - 1 for single, 2 for married
     */
    updateJurisdiction(state, county, filingStatus) {
        if (this.currentStateName !== state.name || this.currentCountyName !== county.name) {
            this.currentStateName = state.name;
            this.currentCountyName = county.name;

            document.querySelectorAll('[data-state-name]').forEach(element => {
                element.textContent = state.name;
            });
            document.querySelectorAll('[data-county-name]').forEach(element => {
                element.textContent = county.name;
            });
            document.title = `Interactive Federal & ${state.name} Tax Visualization Tool`;
            if (this.elements.barState) {
                this.elements.barState.title = `${state.name} State Tax`;
            }
            if (this.elements.barCounty) {
                this.elements.barCounty.title = `${county.name} Tax`;
            }
            if (this.elements.countyBracketNote) {
                this.elements.countyBracketNote.textContent = county.wholeIncome
                    ? `${county.name} applies the rate of the bracket your whole taxable income falls in to all of that income, so only that row shows income and tax. The other rows are $0 by design.`
                    : '';
                this.elements.countyBracketNote.hidden = !county.wholeIncome;
            }
        }

        // Thresholds can differ by filing status, so this is refreshed on every update.
        // It is a live region, so only touch the DOM when the text actually changes.
        const countyInfo = this.describeCountyTax(state, county, filingStatus);
        if (this.elements.countyRateInfo && this.elements.countyRateInfo.textContent !== countyInfo) {
            this.elements.countyRateInfo.textContent = countyInfo;
        }
    }

    /**
     * Describe adjustments, deductions or credits that could only be used in part
     * @param {Object} entered - Amounts the user entered ({adjustments, deductions, credits})
     * @param {Object} result - Federal or state calculation results (with the amounts applied)
     * @returns {string} Note text; empty when everything entered was used
     */
    describeUnusedAmounts(entered, result) {
        const limits = [
            ['adjustments', result.adjustmentsApplied, 'take income below $0'],
            ['deductions', result.deductionsApplied, 'take taxable income below $0'],
            ['credits', result.creditsApplied, 'reduce tax below $0']
        ];
        const notes = limits
            .filter(([key, applied]) => Math.round(entered[key] || 0) > applied)
            .map(([key, applied, limit]) => `${this.formatCurrency(applied)} of the ${this.formatCurrency(Math.round(entered[key]))} ${key} (they cannot ${limit})`);

        return notes.length ? `Not everything you entered could be used: ${notes.join('; ')}.` : '';
    }

    /**
     * Show or hide the note about amounts that could only be used in part
     * @param {HTMLElement} element - Note element
     * @param {Object} entered - Amounts the user entered ({adjustments, deductions, credits})
     * @param {Object} result - Federal or state calculation results (with the amounts applied)
     */
    updateUnusedNote(element, entered, result) {
        if (!element) return;

        const text = this.describeUnusedAmounts(entered, result);
        element.textContent = text;
        element.hidden = !text;
    }

    /**
     * Update federal and state AGI displays
     * @param {Object} calculation - Tax calculation results
     */
    updateAgiDisplays(calculation) {
        if (this.elements.federalAgiDisplay) {
            this.elements.federalAgiDisplay.textContent = this.formatCurrency(calculation.federal.agi);
        }
        if (this.elements.federalTaxableIncomeDisplay) {
            this.elements.federalTaxableIncomeDisplay.textContent = this.formatCurrency(calculation.federal.taxableIncome);
        }
        if (this.elements.stateAgiDisplay) {
            this.elements.stateAgiDisplay.textContent = this.formatCurrency(calculation.state.agi);
        }
        if (this.elements.stateTaxableIncomeDisplay) {
            this.elements.stateTaxableIncomeDisplay.textContent = this.formatCurrency(calculation.state.taxableIncome);
        }
    }

    /**
     * Update visualization bar with federal, state, and county taxes
     * @param {Object} calculation - Tax calculation results
     */
    updateVisualizationBar(calculation) {
        const { federal, state, totals } = calculation;
        const { barTakeHome, barFederal, barState, barCounty } = this.elements;
        if (!(barTakeHome && barFederal && barState && barCounty)) return;
            
        // Every segment is a share of the same income (the larger of the two gross incomes), exactly like the Tax Summary
        const shares = totals.primaryIncome > 0
            ? totals.shares
            : { federal: 0, state: 0, county: 0, takeHome: 100 };

        // Update bar widths
        barTakeHome.style.width = `${shares.takeHome}%`;
        barFederal.style.width = `${shares.federal}%`;
        barState.style.width = `${shares.state}%`;
        barCounty.style.width = `${shares.county}%`;

        // Update percentage display area - use same formatting as Tax Summary (2 decimal places)
        if (this.elements.percentageTakeHome) {
            this.elements.percentageTakeHome.textContent = this.formatPercentage(shares.takeHome);
        }
        if (this.elements.percentageFederal) {
            this.elements.percentageFederal.textContent = this.formatPercentage(shares.federal);
        }
        if (this.elements.percentageState) {
            this.elements.percentageState.textContent = this.formatPercentage(shares.state);
        }
        if (this.elements.percentageCounty) {
            this.elements.percentageCounty.textContent = this.formatPercentage(shares.county);
        }

        // Federal and state gross income are separate inputs; say which income the percentages are based on
        if (this.elements.incomeBasisNote) {
            const incomesDiffer = totals.primaryIncome > 0 && federal.income !== state.income;
            this.elements.incomeBasisNote.textContent = incomesDiffer
                ? `Federal and ${this.currentStateName || 'state'} gross incomes differ, so these percentages are shares of the larger one: ${this.formatCurrency(totals.primaryIncome)}.`
                : '';
            this.elements.incomeBasisNote.hidden = !incomesDiffer;
        }
    }

    /**
     * Update tax summary sections
     * @param {Object} calculation - Tax calculation results
     */
    updateTaxSummary(calculation) {
        const { federal, state, county, totals } = calculation;

        // Federal summary
        if (this.elements.federalAgiSummary) {
            this.elements.federalAgiSummary.textContent = this.formatCurrency(federal.agi);
        }
        if (this.elements.federalTaxableSummary) {
            this.elements.federalTaxableSummary.textContent = this.formatCurrency(federal.taxableIncome);
        }
        if (this.elements.federalTaxSummary) {
            this.elements.federalTaxSummary.textContent = this.formatCurrency(federal.totalTax);
        }
        if (this.elements.federalRateSummary) {
            this.elements.federalRateSummary.textContent = this.formatPercentage(federal.effectiveRate);
        }

        // State summary
        if (this.elements.stateAgiSummary) {
            this.elements.stateAgiSummary.textContent = this.formatCurrency(state.agi);
        }
        if (this.elements.stateTaxableSummary) {
            this.elements.stateTaxableSummary.textContent = this.formatCurrency(state.taxableIncome);
        }
        if (this.elements.stateTaxSummary) {
            this.elements.stateTaxSummary.textContent = this.formatCurrency(state.totalTax);
        }
        if (this.elements.countyTaxSummary) {
            this.elements.countyTaxSummary.textContent = this.formatCurrency(county.totalTax);
        }
        if (this.elements.stateRateSummary) {
            this.elements.stateRateSummary.textContent = this.formatPercentage(state.effectiveRate + county.effectiveRate);
        }

        // Total summary
        if (this.elements.totalFederalDisplay) {
            this.elements.totalFederalDisplay.textContent = this.formatCurrency(federal.totalTax);
        }
        if (this.elements.totalStateDisplay) {
            this.elements.totalStateDisplay.textContent = this.formatCurrency(state.totalTax);
        }
        if (this.elements.totalCountyDisplay) {
            this.elements.totalCountyDisplay.textContent = this.formatCurrency(county.totalTax);
        }
        if (this.elements.totalAllTaxesDisplay) {
            this.elements.totalAllTaxesDisplay.textContent = this.formatCurrency(totals.totalTax);
        }
        if (this.elements.totalTakeHomeDisplay) {
            this.elements.totalTakeHomeDisplay.textContent = this.formatCurrency(totals.postTaxIncome);
        }
        if (this.elements.totalEffectiveRateDisplay) {
            this.elements.totalEffectiveRateDisplay.textContent = this.formatPercentage(totals.effectiveRate);
        }
    }

    /**
     * Update visual calculation displays for custom scenario
     * @param {Object} calculation - Tax calculation results
     * @param {Object} inputs - Input values
     */
    updateVisualCalculations(calculation, inputs) {
        const { federal } = calculation;
        
        // Step 1: Gross Income - Adjustments = AGI
        if (this.elements.visualGrossIncome) {
            this.elements.visualGrossIncome.textContent = this.formatCurrency(federal.income);
        }
        if (this.elements.visualAdjustments) {
            this.elements.visualAdjustments.textContent = this.formatCurrency(federal.adjustmentsApplied);
        }
        if (this.elements.visualAgi) {
            this.elements.visualAgi.textContent = this.formatCurrency(federal.agi);
        }
        if (this.elements.visualAgi2) {
            this.elements.visualAgi2.textContent = this.formatCurrency(federal.agi);
        }

        // Step 2: AGI - Deductions = Taxable Income
        if (this.elements.visualDeductions) {
            this.elements.visualDeductions.textContent = this.formatCurrency(federal.deductionsApplied);
        }
        if (this.elements.visualTaxableIncome) {
            this.elements.visualTaxableIncome.textContent = this.formatCurrency(federal.taxableIncome);
        }
        if (this.elements.visualTaxableIncome2) {
            this.elements.visualTaxableIncome2.textContent = this.formatCurrency(federal.taxableIncome);
        }

        // Step 3: Taxable Income × Tax Rate = Tax Before Credits
        const taxableEffectiveRate = federal.taxableIncome > 0 ? (federal.preCreditTax / federal.taxableIncome) * 100 : 0;
        if (this.elements.visualTaxRate) {
            this.elements.visualTaxRate.textContent = this.formatPercentage(taxableEffectiveRate);
        }
        if (this.elements.visualPreCreditTax) {
            this.elements.visualPreCreditTax.textContent = this.formatCurrency(federal.preCreditTax);
        }
        if (this.elements.visualPreCreditTax2) {
            this.elements.visualPreCreditTax2.textContent = this.formatCurrency(federal.preCreditTax);
        }

        // Step 4: Tax Before Credits - Credits = Total Tax
        if (this.elements.visualCredits) {
            this.elements.visualCredits.textContent = this.formatCurrency(federal.creditsApplied);
        }
        if (this.elements.visualTotalTax) {
            this.elements.visualTotalTax.textContent = this.formatCurrency(federal.totalTax);
        }
        if (this.elements.visualTotalTax2) {
            this.elements.visualTotalTax2.textContent = this.formatCurrency(federal.totalTax);
        }
        if (this.elements.visualTotalTax3) {
            this.elements.visualTotalTax3.textContent = this.formatCurrency(federal.totalTax);
        }

        // Step 5: Gross Income - Total Tax = Take-Home Pay
        if (this.elements.visualGrossIncome2) {
            this.elements.visualGrossIncome2.textContent = this.formatCurrency(federal.income);
        }
        if (this.elements.visualGrossIncome3) {
            this.elements.visualGrossIncome3.textContent = this.formatCurrency(federal.income);
        }
        const takeHomePay = federal.income - federal.totalTax;
        if (this.elements.visualTakeHome) {
            this.elements.visualTakeHome.textContent = this.formatCurrency(takeHomePay);
        }

        // Step 6: Effective Rate
        if (this.elements.visualEffectiveRate) {
            this.elements.visualEffectiveRate.textContent = this.formatPercentage(federal.effectiveRate);
        }

        // The boxes above show what was actually used; say so when that is less than what was entered
        this.updateUnusedNote(this.elements.federalUnusedNote, {
            adjustments: inputs.federalAdjustments,
            deductions: inputs.federalDeductions,
            credits: inputs.federalCredits
        }, federal);
    }

    /**
     * Update state visual calculation displays for custom scenario
     * @param {Object} calculation - Tax calculation results
     * @param {Object} inputs - Input values
     */
    updateStateVisualCalculations(calculation, inputs) {
        const { state, county } = calculation;
        
        // Step 1: Gross Income - Adjustments = AGI
        if (this.elements.stateVisualGrossIncome) {
            this.elements.stateVisualGrossIncome.textContent = this.formatCurrency(state.income);
        }
        if (this.elements.stateVisualAdjustments) {
            this.elements.stateVisualAdjustments.textContent = this.formatCurrency(state.adjustmentsApplied);
        }
        if (this.elements.stateVisualAgi) {
            this.elements.stateVisualAgi.textContent = this.formatCurrency(state.agi);
        }
        if (this.elements.stateVisualAgi2) {
            this.elements.stateVisualAgi2.textContent = this.formatCurrency(state.agi);
        }

        // Step 2: AGI - Deductions = Taxable Income
        if (this.elements.stateVisualDeductions) {
            this.elements.stateVisualDeductions.textContent = this.formatCurrency(state.deductionsApplied);
        }
        if (this.elements.stateVisualTaxableIncome) {
            this.elements.stateVisualTaxableIncome.textContent = this.formatCurrency(state.taxableIncome);
        }
        if (this.elements.stateVisualTaxableIncome2) {
            this.elements.stateVisualTaxableIncome2.textContent = this.formatCurrency(state.taxableIncome);
        }
        if (this.elements.stateVisualTaxableIncome3) {
            this.elements.stateVisualTaxableIncome3.textContent = this.formatCurrency(state.taxableIncome);
        }

        // Step 3: Taxable Income × State Tax Rate = State Tax Before Credits
        const stateTaxableEffectiveRate = state.taxableIncome > 0 ? (state.preCreditTax / state.taxableIncome) * 100 : 0;
        if (this.elements.stateVisualStateTaxRate) {
            this.elements.stateVisualStateTaxRate.textContent = this.formatPercentage(stateTaxableEffectiveRate);
        }
        if (this.elements.stateVisualStatePreCreditTax) {
            this.elements.stateVisualStatePreCreditTax.textContent = this.formatCurrency(state.preCreditTax);
        }
        if (this.elements.stateVisualStatePreCreditTax2) {
            this.elements.stateVisualStatePreCreditTax2.textContent = this.formatCurrency(state.preCreditTax);
        }

        // Step 4: Taxable Income × County Tax Rate = County Tax
        const countyTaxableEffectiveRate = state.taxableIncome > 0 ? (county.totalTax / state.taxableIncome) * 100 : 0;
        if (this.elements.stateVisualCountyTaxRate) {
            this.elements.stateVisualCountyTaxRate.textContent = this.formatPercentage(countyTaxableEffectiveRate);
        }
        if (this.elements.stateVisualCountyTax) {
            this.elements.stateVisualCountyTax.textContent = this.formatCurrency(county.totalTax);
        }
        if (this.elements.stateVisualCountyTax2) {
            this.elements.stateVisualCountyTax2.textContent = this.formatCurrency(county.totalTax);
        }

        // Step 5: State Tax Before Credits - Credits = Total State Tax
        if (this.elements.stateVisualCredits) {
            this.elements.stateVisualCredits.textContent = this.formatCurrency(state.creditsApplied);
        }
        if (this.elements.stateVisualTotalStateTax) {
            this.elements.stateVisualTotalStateTax.textContent = this.formatCurrency(state.totalTax);
        }
        if (this.elements.stateVisualTotalStateTax2) {
            this.elements.stateVisualTotalStateTax2.textContent = this.formatCurrency(state.totalTax);
        }

        // Step 6: Total State Tax + County Tax = Combined State Tax
        const combinedStateTax = state.totalTax + county.totalTax;
        if (this.elements.stateVisualCombinedTax) {
            this.elements.stateVisualCombinedTax.textContent = this.formatCurrency(combinedStateTax);
        }
        if (this.elements.stateVisualCombinedTax2) {
            this.elements.stateVisualCombinedTax2.textContent = this.formatCurrency(combinedStateTax);
        }
        if (this.elements.stateVisualCombinedTax3) {
            this.elements.stateVisualCombinedTax3.textContent = this.formatCurrency(combinedStateTax);
        }

        // Step 7: Gross Income - Combined State Tax = Take-Home Pay
        if (this.elements.stateVisualGrossIncome2) {
            this.elements.stateVisualGrossIncome2.textContent = this.formatCurrency(state.income);
        }
        if (this.elements.stateVisualGrossIncome3) {
            this.elements.stateVisualGrossIncome3.textContent = this.formatCurrency(state.income);
        }
        const takeHomePay = state.income - combinedStateTax;
        if (this.elements.stateVisualTakeHome) {
            this.elements.stateVisualTakeHome.textContent = this.formatCurrency(takeHomePay);
        }

        // Step 8: Effective Rate
        const combinedEffectiveRate = state.income > 0 ? (combinedStateTax / state.income) * 100 : 0;
        if (this.elements.stateVisualEffectiveRate) {
            this.elements.stateVisualEffectiveRate.textContent = this.formatPercentage(combinedEffectiveRate);
        }

        // The boxes above show what was actually used; say so when that is less than what was entered
        this.updateUnusedNote(this.elements.stateUnusedNote, {
            adjustments: inputs.stateAdjustments,
            deductions: inputs.stateDeductions,
            credits: inputs.stateCredits
        }, state);
    }

    /**
     * Update state visual calculation displays for baseline scenario
     * @param {Object} stateBaselineCalculation - State baseline tax calculation results (includes the deduction used)
     */
    updateStateBaselineVisualCalculations(stateBaselineCalculation) {
        const { state, county, combined, deductionsApplied } = stateBaselineCalculation;
        const grossIncome = state.income;
        
        // Step 1: Gross Income - Adjustments = AGI
        if (this.elements.stateBaselineGrossIncome) {
            this.elements.stateBaselineGrossIncome.textContent = this.formatCurrency(grossIncome);
        }
        if (this.elements.stateBaselineAdjustments) {
            this.elements.stateBaselineAdjustments.textContent = this.formatCurrency(0);
        }
        if (this.elements.stateBaselineAgi) {
            this.elements.stateBaselineAgi.textContent = this.formatCurrency(state.agi);
        }
        if (this.elements.stateBaselineAgi2) {
            this.elements.stateBaselineAgi2.textContent = this.formatCurrency(state.agi);
        }

        // Step 2: AGI - Deductions = Taxable Income
        if (this.elements.stateBaselineDeductions) {
            this.elements.stateBaselineDeductions.textContent = this.formatCurrency(deductionsApplied);
        }
        if (this.elements.stateBaselineTaxableIncome) {
            this.elements.stateBaselineTaxableIncome.textContent = this.formatCurrency(state.taxableIncome);
        }
        if (this.elements.stateBaselineTaxableIncome2) {
            this.elements.stateBaselineTaxableIncome2.textContent = this.formatCurrency(state.taxableIncome);
        }
        if (this.elements.stateBaselineTaxableIncome3) {
            this.elements.stateBaselineTaxableIncome3.textContent = this.formatCurrency(state.taxableIncome);
        }

        // Step 3: Taxable Income × State Tax Rate = State Tax Before Credits
        const stateTaxableEffectiveRate = state.taxableIncome > 0 ? (state.preCreditTax / state.taxableIncome) * 100 : 0;
        if (this.elements.stateBaselineStateTaxRate) {
            this.elements.stateBaselineStateTaxRate.textContent = this.formatPercentage(stateTaxableEffectiveRate);
        }
        if (this.elements.stateBaselineStatePreCreditTax) {
            this.elements.stateBaselineStatePreCreditTax.textContent = this.formatCurrency(state.preCreditTax);
        }
        if (this.elements.stateBaselineStatePreCreditTax2) {
            this.elements.stateBaselineStatePreCreditTax2.textContent = this.formatCurrency(state.preCreditTax);
        }

        // Step 4: Taxable Income × County Tax Rate = County Tax
        const countyTaxableEffectiveRate = state.taxableIncome > 0 ? (county.totalTax / state.taxableIncome) * 100 : 0;
        if (this.elements.stateBaselineCountyTaxRate) {
            this.elements.stateBaselineCountyTaxRate.textContent = this.formatPercentage(countyTaxableEffectiveRate);
        }
        if (this.elements.stateBaselineCountyTax) {
            this.elements.stateBaselineCountyTax.textContent = this.formatCurrency(county.totalTax);
        }
        if (this.elements.stateBaselineCountyTax2) {
            this.elements.stateBaselineCountyTax2.textContent = this.formatCurrency(county.totalTax);
        }

        // Step 5: State Tax Before Credits - Credits = Total State Tax
        if (this.elements.stateBaselineCredits) {
            this.elements.stateBaselineCredits.textContent = this.formatCurrency(0);
        }
        if (this.elements.stateBaselineTotalStateTax) {
            this.elements.stateBaselineTotalStateTax.textContent = this.formatCurrency(state.totalTax);
        }
        if (this.elements.stateBaselineTotalStateTax2) {
            this.elements.stateBaselineTotalStateTax2.textContent = this.formatCurrency(state.totalTax);
        }

        // Step 6: Total State Tax + County Tax = Combined State Tax
        if (this.elements.stateBaselineCombinedTax) {
            this.elements.stateBaselineCombinedTax.textContent = this.formatCurrency(combined.totalTax);
        }
        if (this.elements.stateBaselineCombinedTax2) {
            this.elements.stateBaselineCombinedTax2.textContent = this.formatCurrency(combined.totalTax);
        }
        if (this.elements.stateBaselineCombinedTax3) {
            this.elements.stateBaselineCombinedTax3.textContent = this.formatCurrency(combined.totalTax);
        }

        // Step 7: Gross Income - Combined State Tax = Take-Home Pay
        if (this.elements.stateBaselineGrossIncome2) {
            this.elements.stateBaselineGrossIncome2.textContent = this.formatCurrency(grossIncome);
        }
        if (this.elements.stateBaselineGrossIncome3) {
            this.elements.stateBaselineGrossIncome3.textContent = this.formatCurrency(grossIncome);
        }
        if (this.elements.stateBaselineTakeHome) {
            this.elements.stateBaselineTakeHome.textContent = this.formatCurrency(combined.postTaxIncome);
        }

        // Step 8: Effective Rate
        if (this.elements.stateBaselineEffectiveRate) {
            this.elements.stateBaselineEffectiveRate.textContent = this.formatPercentage(combined.effectiveRate);
        }
    }

    /**
     * Clear state baseline visual calculations when no income
     */
    clearStateBaselineVisualCalculations() {
        const elementsToUpdate = [
            'stateBaselineGrossIncome', 'stateBaselineAdjustments', 'stateBaselineAgi', 'stateBaselineAgi2',
            'stateBaselineDeductions', 'stateBaselineTaxableIncome', 'stateBaselineTaxableIncome2', 'stateBaselineTaxableIncome3',
            'stateBaselineStatePreCreditTax', 'stateBaselineStatePreCreditTax2', 'stateBaselineCountyTax', 'stateBaselineCountyTax2',
            'stateBaselineCredits', 'stateBaselineTotalStateTax', 'stateBaselineTotalStateTax2',
            'stateBaselineCombinedTax', 'stateBaselineCombinedTax2', 'stateBaselineCombinedTax3',
            'stateBaselineGrossIncome2', 'stateBaselineGrossIncome3', 'stateBaselineTakeHome'
        ];

        elementsToUpdate.forEach(elementName => {
            if (this.elements[elementName]) {
                this.elements[elementName].textContent = this.formatCurrency(0);
            }
        });

        const percentageElements = [
            'stateBaselineStateTaxRate', 'stateBaselineCountyTaxRate', 'stateBaselineEffectiveRate'
        ];

        percentageElements.forEach(elementName => {
            if (this.elements[elementName]) {
                this.elements[elementName].textContent = this.formatPercentage(0);
            }
        });
    }

    /**
     * Update visual calculation displays for baseline scenario
     * @param {Object} baselineCalculation - Baseline tax calculation results (includes the deduction used)
     */
    updateBaselineVisualCalculations(baselineCalculation) {
        const grossIncome = baselineCalculation.income;

        // Step 1: Gross Income - Adjustments = AGI
        if (this.elements.baselineGrossIncome) {
            this.elements.baselineGrossIncome.textContent = this.formatCurrency(grossIncome);
        }
        if (this.elements.baselineAdjustments) {
            this.elements.baselineAdjustments.textContent = this.formatCurrency(0);
        }
        if (this.elements.baselineAgi) {
            this.elements.baselineAgi.textContent = this.formatCurrency(baselineCalculation.agi);
        }
        if (this.elements.baselineAgi2) {
            this.elements.baselineAgi2.textContent = this.formatCurrency(baselineCalculation.agi);
        }

        // Step 2: AGI - Deductions = Taxable Income
        if (this.elements.baselineDeductions) {
            this.elements.baselineDeductions.textContent = this.formatCurrency(baselineCalculation.deductionsApplied);
        }
        if (this.elements.baselineTaxableIncome) {
            this.elements.baselineTaxableIncome.textContent = this.formatCurrency(baselineCalculation.taxableIncome);
        }
        if (this.elements.baselineTaxableIncome2) {
            this.elements.baselineTaxableIncome2.textContent = this.formatCurrency(baselineCalculation.taxableIncome);
        }

        // Step 3: Taxable Income × Tax Rate = Tax Before Credits
        const taxableEffectiveRate = baselineCalculation.taxableIncome > 0 ? (baselineCalculation.preCreditTax / baselineCalculation.taxableIncome) * 100 : 0;
        if (this.elements.baselineTaxRate) {
            this.elements.baselineTaxRate.textContent = this.formatPercentage(taxableEffectiveRate);
        }
        if (this.elements.baselinePreCreditTax) {
            this.elements.baselinePreCreditTax.textContent = this.formatCurrency(baselineCalculation.preCreditTax);
        }
        if (this.elements.baselinePreCreditTax2) {
            this.elements.baselinePreCreditTax2.textContent = this.formatCurrency(baselineCalculation.preCreditTax);
        }

        // Step 4: Tax Before Credits - Credits = Total Tax
        if (this.elements.baselineCredits) {
            this.elements.baselineCredits.textContent = this.formatCurrency(0);
        }
        if (this.elements.baselineTotalTax) {
            this.elements.baselineTotalTax.textContent = this.formatCurrency(baselineCalculation.totalTax);
        }
        if (this.elements.baselineTotalTax2) {
            this.elements.baselineTotalTax2.textContent = this.formatCurrency(baselineCalculation.totalTax);
        }
        if (this.elements.baselineTotalTax3) {
            this.elements.baselineTotalTax3.textContent = this.formatCurrency(baselineCalculation.totalTax);
        }

        // Step 5: Gross Income - Total Tax = Take-Home Pay
        if (this.elements.baselineGrossIncome2) {
            this.elements.baselineGrossIncome2.textContent = this.formatCurrency(grossIncome);
        }
        if (this.elements.baselineGrossIncome3) {
            this.elements.baselineGrossIncome3.textContent = this.formatCurrency(grossIncome);
        }
        if (this.elements.baselineTakeHome) {
            this.elements.baselineTakeHome.textContent = this.formatCurrency(baselineCalculation.postTaxIncome);
        }

        // Step 6: Effective Rate
        if (this.elements.baselineEffectiveRate) {
            this.elements.baselineEffectiveRate.textContent = this.formatPercentage(baselineCalculation.grossEffectiveRate);
        }
    }

    /**
     * Clear baseline visual calculations when no income
     */
    clearBaselineVisualCalculations() {
        const elementsToUpdate = [
            'baselineGrossIncome', 'baselineAdjustments', 'baselineAgi', 'baselineAgi2',
            'baselineDeductions', 'baselineTaxableIncome', 'baselineTaxableIncome2',
            'baselineTaxRate', 'baselinePreCreditTax', 'baselinePreCreditTax2',
            'baselineCredits', 'baselineTotalTax', 'baselineGrossIncome2',
            'baselineTotalTax2', 'baselineTakeHome', 'baselineTotalTax3',
            'baselineGrossIncome3'
        ];

        elementsToUpdate.forEach(elementName => {
            if (this.elements[elementName]) {
                this.elements[elementName].textContent = this.formatCurrency(0);
            }
        });

        if (this.elements.baselineTaxRate) {
            this.elements.baselineTaxRate.textContent = this.formatPercentage(0);
        }
        if (this.elements.baselineEffectiveRate) {
            this.elements.baselineEffectiveRate.textContent = this.formatPercentage(0);
        }
    }

    /**
     * Update all displays with current data
     * @param {Object} calculation - Complete tax calculation results
     * @param {Object} inputs - Input values
     * @param {Object} baselineCalculation - Federal baseline calculation results (from TaxCalculator.calculateBaseline)
     * @param {Object} stateBaselineCalculation - State baseline calculation results (from TaxCalculator.calculateStateBaseline)
     */
    updateAll(calculation, inputs = {}, baselineCalculation = null, stateBaselineCalculation = null) {
        this.updateAgiDisplays(calculation);
        this.updateVisualizationBar(calculation);
        this.updateTaxSummary(calculation);
        
        // Update visual calculations
        this.updateVisualCalculations(calculation, inputs);
        this.updateStateVisualCalculations(calculation, inputs);
        
        // Update baseline if provided and income > 0
        if (baselineCalculation && baselineCalculation.income > 0) {
            this.updateBaselineVisualCalculations(baselineCalculation);
        } else {
            // Clear baseline when no income
            this.clearBaselineVisualCalculations();
        }

        // Update state baseline if provided and state income > 0
        if (stateBaselineCalculation && stateBaselineCalculation.state.income > 0) {
            this.updateStateBaselineVisualCalculations(stateBaselineCalculation);
        } else {
            // Clear state baseline when no income
            this.clearStateBaselineVisualCalculations();
        }
    }

    /**
     * Update bracket breakdown tables with tax calculation details
     * @param {Object} taxInputs - Tax calculation inputs
     * @param {Object} taxCalculator - Tax calculator instance
     */
    updateBracketBreakdown(taxInputs, taxCalculator) {
        const breakdown = taxCalculator.getCompleteTaxBreakdown(taxInputs);
        
        // Update federal breakdown table
        this.updateBracketTable(
            'federal-bracket-table', 
            breakdown.federal,
            'federal-total-income',
            'federal-total-tax'
        );
        
        // Update state breakdown table
        this.updateBracketTable(
            'state-bracket-table',
            breakdown.state,
            'state-total-income',
            'state-total-tax'
        );
        
        // Update county breakdown table
        this.updateBracketTable(
            'county-bracket-table',
            breakdown.county,
            'county-total-income',
            'county-total-tax'
        );
    }

    /**
     * Update a specific bracket breakdown table
     * @param {string} tableId - ID of the table to update
     * @param {Object} breakdown - Bracket breakdown data
     * @param {string} totalIncomeId - ID of total income element
     * @param {string} totalTaxId - ID of total tax element
     */
    updateBracketTable(tableId, breakdown, totalIncomeId, totalTaxId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // Clear existing rows
        tbody.innerHTML = '';

        // Add bracket rows
        breakdown.brackets.forEach((bracket) => {
            const row = document.createElement('tr');
            
            // Determine if this bracket has any tax (for highlighting)
            const hasActivity = bracket.taxIncomeInBracket > 0;
            if (hasActivity) {
                row.classList.add('active-bracket');
            }

            row.innerHTML = `
                <td>${this.formatCurrency(bracket.lowerLimit)}</td>
                <td>${bracket.upperLimit === 'No Limit' ? 'No Limit' : this.formatCurrency(bracket.upperLimit)}</td>
                <td>${bracket.rate.toFixed(2)}%</td>
                <td>${this.formatCurrency(bracket.incomeRemaining)}</td>
                <td>${this.formatCurrency(bracket.taxIncomeInBracket)}</td>
                <td>${this.formatCurrency(bracket.taxAmount)}</td>
            `;
            
            tbody.appendChild(row);
        });

        // Update totals
        const totalIncomeElement = document.getElementById(totalIncomeId);
        const totalTaxElement = document.getElementById(totalTaxId);
        
        if (totalIncomeElement) {
            totalIncomeElement.textContent = this.formatCurrency(breakdown.totalIncome);
        }
        
        if (totalTaxElement) {
            totalTaxElement.textContent = this.formatCurrency(breakdown.totalTax);
        }
    }
}