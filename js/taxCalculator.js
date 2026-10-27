/**
 * Tax Calculation Module
 * Handles all tax calculation logic including federal tax brackets and computations
 *
 * Rounding policy: every dollar amount is a whole dollar, as on a tax return. Inputs are rounded to
 * whole dollars and each tax (a bracket-schedule total or a county's tax) is rounded once, so the
 * figures shown for the parts always add up to the figures shown for the totals.
 */

import { DEFAULT_STATE_CODE, getStateData, getCountyData, filingStatusKey } from './jurisdictionData.js';

/**
 * Clean up a dollar input: anything that is not a positive number counts as 0, fractions round to whole dollars
 * @param {number} value - Raw amount
 * @returns {number} Whole-dollar amount, never negative
 */
const toAmount = (value) => (Number.isFinite(value) && value > 0 ? Math.round(value) : 0);

/**
 * Express an amount as a percentage of a base amount
 * @param {number} amount - Part
 * @param {number} base - Whole
 * @returns {number} Percentage, or 0 when there is no base
 */
const percentOf = (amount, base) => (base > 0 ? (amount / base) * 100 : 0);

/**
 * Round parts to whole dollars so that they add up to the rounded total (largest-remainder method)
 * @param {number[]} parts - Unrounded amounts
 * @returns {number[]} Whole-dollar amounts whose sum is the rounded sum of the parts
 */
const roundPartsToTotal = (parts) => {
    const total = Math.round(parts.reduce((sum, part) => sum + part, 0));
    const rounded = parts.map(Math.floor);
    let shortfall = total - rounded.reduce((sum, part) => sum + part, 0);

    // Hand the missing dollars to the parts with the biggest fractions (earlier parts win ties)
    const byFraction = parts
        .map((part, index) => [part - Math.floor(part), index])
        .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (const [, index] of byFraction) {
        if (shortfall <= 0) break;
        rounded[index] += 1;
        shortfall -= 1;
    }

    return rounded;
};

/**
 * Take adjustments, deductions and credits off in order. Each can only use what is left, so AGI,
 * taxable income and tax never go below zero, and the amounts reported as applied always add up.
 * @param {number} income - Gross income (whole dollars)
 * @param {number} adjustments - Adjustments to income entered
 * @param {number} deductions - Deductions entered
 * @param {number} credits - Tax credits entered
 * @param {Function} taxOn - Function that returns the tax on a taxable income
 * @returns {Object} Income, AGI, taxable income, taxes and the adjustments, deductions and credits actually applied
 */
const applyAllowances = (income, adjustments, deductions, credits, taxOn) => {
    const adjustmentsApplied = Math.min(adjustments, income);
    const agi = income - adjustmentsApplied;
    const deductionsApplied = Math.min(deductions, agi);
    const taxableIncome = agi - deductionsApplied;
    const preCreditTax = taxOn(taxableIncome);
    const creditsApplied = Math.min(credits, preCreditTax);

    return {
        income,
        agi,
        taxableIncome,
        preCreditTax,
        totalTax: preCreditTax - creditsApplied,
        adjustmentsApplied,
        deductionsApplied,
        creditsApplied
    };
};

export class TaxCalculator {
    constructor() {
        // 2025 Federal tax brackets (IRS Rev. Proc. 2024-40; state and county brackets live in jurisdictionData.js)
        this.federalBrackets = {
            single: [[11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24], [250525, 0.32], [626350, 0.35], [Infinity, 0.37]],
            married: [[23850, 0.10], [96950, 0.12], [206700, 0.22], [394600, 0.24], [501050, 0.32], [751600, 0.35], [Infinity, 0.37]]
        };
        
        // 2025 federal standard deductions (P.L. 119-21 raised the Rev. Proc. 2024-40 amounts)
        this.standardDeductions = {
            single: 15750,
            married: 31500
        };
    }

    /**
     * Calculate tax based on bracket system
     * @param {number} income - Taxable income
     * @param {Array} brackets - Tax bracket array
     * @returns {number} Calculated tax amount in whole dollars
     */
    calculateBracketTax(income, brackets) {
        return this.calculateBracketBreakdown(income, brackets).totalTax;
    }
            
    /**
     * Calculate tax where the rate of the bracket the income falls in applies to ALL of the income
     * (used by counties whose graduated rates are not marginal, e.g. Frederick County, MD)
     * @param {number} income - Taxable income
     * @param {Array} brackets - Tax bracket array
     * @returns {number} Calculated tax amount in whole dollars
     */
    calculateWholeIncomeTax(income, brackets) {
        if (!(income > 0)) return 0; // also covers NaN/undefined, like calculateBracketTax
            
        const [, rate] = brackets.find(([bracketLimit]) => income <= bracketLimit);
        return Math.round(income * rate);
    }
        
    /**
     * Calculate a county's local income tax using the method that county uses
     * @param {number} income - Taxable income
     * @param {string} stateCode - State code (e.g. 'MD', 'VA')
     * @param {string} countyCode - County code; undefined means the state's default county
     * @param {number} filingStatus - 1 for single, 2 for married
     * @returns {number} Calculated tax amount in whole dollars
     */
    calculateCountyTax(income, stateCode, countyCode, filingStatus) {
        const brackets = this.getCountyBrackets(stateCode, countyCode, filingStatus);
        return getCountyData(stateCode, countyCode).wholeIncome
            ? this.calculateWholeIncomeTax(income, brackets)
            : this.calculateBracketTax(income, brackets);
    }

    /**
     * Get federal tax brackets for filing status
     * @param {number} filingStatus - 1 for single, 2 for married
     * @returns {Array} Tax brackets array
     */
    getFederalBrackets(filingStatus) {
        return this.federalBrackets[filingStatusKey(filingStatus)];
    }

    /**
     * Get state income tax brackets for filing status
     * @param {string} stateCode - State code (e.g. 'MD', 'VA')
     * @param {number} filingStatus - 1 for single, 2 for married
     * @returns {Array} Tax brackets array
     */
    getStateBrackets(stateCode, filingStatus) {
        return getStateData(stateCode).brackets[filingStatusKey(filingStatus)];
    }

    /**
     * Get county (local) income tax brackets for filing status
     * @param {string} stateCode - State code (e.g. 'MD', 'VA')
     * @param {string} countyCode - County code; undefined means the state's default county
     * @param {number} filingStatus - 1 for single, 2 for married
     * @returns {Array} Tax brackets array
     */
    getCountyBrackets(stateCode, countyCode, filingStatus) {
        return getCountyData(stateCode, countyCode).brackets[filingStatusKey(filingStatus)];
    }

    /**
     * Get standard deduction for filing status
     * @param {number} filingStatus - 1 for single, 2 for married
     * @returns {number} Standard deduction amount
     */
    getStandardDeduction(filingStatus) {
        return this.standardDeductions[filingStatusKey(filingStatus)];
    }

    /**
     * Get a state's own standard deduction (states do not use the federal amount)
     * @param {string} stateCode - State code (e.g. 'MD', 'VA')
     * @param {number} filingStatus - 1 for single, 2 for married
     * @returns {number} Standard deduction amount
     */
    getStateStandardDeduction(stateCode, filingStatus) {
        return getStateData(stateCode).standardDeduction[filingStatusKey(filingStatus)];
    }

    /**
     * Calculate complete tax scenario including federal, state, and county taxes
     * @param {Object} params - Tax calculation parameters
     * @returns {Object} Complete tax calculation results
     */
    calculateTaxes(params) {
        const { income, adjustments, deductions, credits, filingStatus } = params;
        const brackets = this.getFederalBrackets(filingStatus);
        
        const result = applyAllowances(
            toAmount(income), toAmount(adjustments), toAmount(deductions), toAmount(credits),
            (taxableIncome) => this.calculateBracketTax(taxableIncome, brackets)
        );
        
        return {
            ...result,
            postTaxIncome: result.income - result.totalTax,
            taxableEffectiveRate: percentOf(result.preCreditTax, result.taxableIncome),
            grossEffectiveRate: percentOf(result.totalTax, result.income)
        };
    }

    /**
     * Calculate complete tax scenario with state and county taxes
     * @param {Object} params - Tax calculation parameters including state inputs
     * @param {string} [params.stateCode] - State code ('MD' or 'VA'); defaults to Maryland
     * @param {string} [params.countyCode] - County code; defaults to the state's default county
     * @returns {Object} Complete tax calculation results with federal, state, and county breakdowns.
     *     federal and state include the income, adjustments, deductions and credits actually applied;
     *     totals.shares express each tax and the take-home pay as a percentage of totals.primaryIncome
     */
    calculateAllTaxes(params) {
        const { 
            // Federal parameters
            federalIncome, federalAdjustments, federalDeductions, federalCredits,
            // State parameters
            stateIncome, stateAdjustments, stateDeductions, stateCredits,
            // Common parameters
            filingStatus,
            // Jurisdiction (optional - defaults keep the original Maryland / Anne Arundel behavior)
            stateCode = DEFAULT_STATE_CODE, countyCode
        } = params;
        
        const federalBrackets = this.getFederalBrackets(filingStatus);
        const stateBrackets = this.getStateBrackets(stateCode, filingStatus);
        
        // Federal and state calculations
        const federal = applyAllowances(
            toAmount(federalIncome), toAmount(federalAdjustments), toAmount(federalDeductions), toAmount(federalCredits),
            (taxableIncome) => this.calculateBracketTax(taxableIncome, federalBrackets)
        );
        const state = applyAllowances(
            toAmount(stateIncome), toAmount(stateAdjustments), toAmount(stateDeductions), toAmount(stateCredits),
            (taxableIncome) => this.calculateBracketTax(taxableIncome, stateBrackets)
        );
        
        // County calculations (based on state taxable income)
        const countyTax = this.calculateCountyTax(state.taxableIncome, stateCode, countyCode, filingStatus);
        
        // Total calculations
        const totalTax = federal.totalTax + state.totalTax + countyTax;
        const primaryIncome = Math.max(federal.income, state.income);
        const postTaxIncome = primaryIncome - totalTax;
        
        return {
            federal: {
                ...federal,
                effectiveRate: percentOf(federal.totalTax, federal.income)
            },
            state: {
                ...state,
                effectiveRate: percentOf(state.totalTax, state.income)
            },
            county: {
                totalTax: countyTax,
                effectiveRate: percentOf(countyTax, state.income)
            },
            totals: {
                totalTax,
                postTaxIncome,
                effectiveRate: percentOf(totalTax, primaryIncome),
                primaryIncome,
                shares: {
                    federal: percentOf(federal.totalTax, primaryIncome),
                    state: percentOf(state.totalTax, primaryIncome),
                    county: percentOf(countyTax, primaryIncome),
                    takeHome: percentOf(postTaxIncome, primaryIncome)
                }
            }
        };
    }

    /**
     * Calculate baseline scenario (standard deduction, no adjustments/credits)
     * @param {number} income - Gross income
     * @param {number} filingStatus - Filing status
     * @returns {Object} Baseline calculation results
     */
    calculateBaseline(income, filingStatus) {
        return this.calculateTaxes({
            income,
            adjustments: 0,
            deductions: this.getStandardDeduction(filingStatus),
            credits: 0,
            filingStatus
        });
    }

    /**
     * Calculate state baseline scenario (the state's own standard deduction, no adjustments/credits)
     * @param {number} income - Gross income
     * @param {number} filingStatus - Filing status
     * @param {string} [stateCode] - State code ('MD' or 'VA'); defaults to Maryland
     * @param {string} [countyCode] - County code; defaults to the state's default county
     * @returns {Object} State baseline calculation results (includes the standard deduction and how much of it was used)
     */
    calculateStateBaseline(income, filingStatus, stateCode = DEFAULT_STATE_CODE, countyCode) {
        const standardDeduction = this.getStateStandardDeduction(stateCode, filingStatus);
        const inputs = {
            federalIncome: 0,
            federalAdjustments: 0,
            federalDeductions: 0,
            federalCredits: 0,
            stateIncome: income,
            stateAdjustments: 0,
            stateDeductions: standardDeduction,
            stateCredits: 0,
            filingStatus,
            stateCode,
            countyCode
        };
        
        const fullCalculation = this.calculateAllTaxes(inputs);
        const combinedTax = fullCalculation.state.totalTax + fullCalculation.county.totalTax;
        
        // Return only the state and county portions
        return {
            standardDeduction,
            deductionsApplied: fullCalculation.state.deductionsApplied,
            state: fullCalculation.state,
            county: fullCalculation.county,
            combined: {
                totalTax: combinedTax,
                postTaxIncome: fullCalculation.state.income - combinedTax,
                effectiveRate: percentOf(combinedTax, fullCalculation.state.income)
            }
        };
    }

    /**
     * Calculate detailed tax bracket breakdown for visual display. Every bracket gets a row (all
     * zeros when there is no income); the per-bracket taxes are whole dollars that add up to totalTax.
     * @param {number} income - Taxable income
     * @param {Array} brackets - Tax bracket array
     * @param {string} jurisdiction - Name of the tax jurisdiction
     * @returns {Object} Detailed breakdown with bracket-by-bracket information
     */
    calculateBracketBreakdown(income, brackets, jurisdiction) {
        const taxableIncome = Number.isFinite(income) && income > 0 ? income : 0;
        let previousLimit = 0;
        let remainingIncome = taxableIncome;
            
        const bracketDetails = brackets.map(([bracketLimit, rate]) => {
            const taxIncomeInBracket = Math.min(remainingIncome, bracketLimit - previousLimit);
            const bracketDetail = {
                lowerLimit: previousLimit,
                upperLimit: bracketLimit === Infinity ? 'No Limit' : bracketLimit,
                rate: rate * 100,
                incomeRemaining: remainingIncome,
                taxIncomeInBracket,
                taxAmount: taxIncomeInBracket * rate
            };

            remainingIncome -= taxIncomeInBracket;
            previousLimit = bracketLimit;
            return bracketDetail;
        });
            
        const taxAmounts = roundPartsToTotal(bracketDetails.map(bracketDetail => bracketDetail.taxAmount));
        bracketDetails.forEach((bracketDetail, index) => {
            bracketDetail.taxAmount = taxAmounts[index];
        });

        return {
            jurisdiction,
            totalTax: taxAmounts.reduce((sum, taxAmount) => sum + taxAmount, 0),
            totalIncome: taxableIncome,
            brackets: bracketDetails
        };
    }
            
    /**
     * Calculate detailed bracket breakdown where the rate of the bracket the income falls in
     * applies to ALL of the income (same result shape as calculateBracketBreakdown)
     * @param {number} income - Taxable income
     * @param {Array} brackets - Tax bracket array
     * @param {string} jurisdiction - Name of the tax jurisdiction
     * @returns {Object} Detailed breakdown with bracket-by-bracket information
     */
    calculateWholeIncomeBreakdown(income, brackets, jurisdiction) {
        const taxableIncome = Number.isFinite(income) && income > 0 ? income : 0;
        let previousLimit = 0;
        let totalTax = 0;

        const bracketDetails = brackets.map(([bracketLimit, rate]) => {
            const lowerLimit = previousLimit;
            previousLimit = bracketLimit;

            // Only the bracket the income falls in has any tax, and it taxes the whole income
            const applies = taxableIncome > lowerLimit && taxableIncome <= bracketLimit;
            const taxAmount = applies ? Math.round(taxableIncome * rate) : 0;
            totalTax += taxAmount;

            return {
                lowerLimit,
                upperLimit: bracketLimit === Infinity ? 'No Limit' : bracketLimit,
                rate: rate * 100,
                incomeRemaining: applies ? taxableIncome : 0,
                taxIncomeInBracket: applies ? taxableIncome : 0,
                taxAmount
            };
        });
        
        return {
            jurisdiction,
            totalTax,
            totalIncome: taxableIncome,
            brackets: bracketDetails
        };
    }

    /**
     * Get complete tax breakdown for all jurisdictions. Totals are before credits.
     * @param {Object} inputs - Tax calculation inputs
     * @returns {Object} Complete breakdown for federal, state, and county taxes
     */
    getCompleteTaxBreakdown(inputs) {
        const { stateCode = DEFAULT_STATE_CODE, countyCode, filingStatus } = inputs;
        
        // Taxable incomes come from the same calculation the rest of the app uses
        const { federal, state } = this.calculateAllTaxes(inputs);
        
        // Get brackets
        const federalBrackets = this.getFederalBrackets(filingStatus);
        const stateBrackets = this.getStateBrackets(stateCode, filingStatus);
        const countyBrackets = this.getCountyBrackets(stateCode, countyCode, filingStatus);
        const stateName = getStateData(stateCode).name;
        const county = getCountyData(stateCode, countyCode);
        
        // Calculate breakdowns
        const federalBreakdown = this.calculateBracketBreakdown(
            federal.taxableIncome,
            federalBrackets, 
            'Federal Tax Bracket Breakdown'
        );
        
        const stateBreakdown = this.calculateBracketBreakdown(
            state.taxableIncome,
            stateBrackets,
            `${stateName} Tax Bracket Breakdown`
        );
        
        const countyJurisdiction = `${county.name} Tax Bracket Breakdown`;
        const countyBreakdown = county.wholeIncome
            ? this.calculateWholeIncomeBreakdown(state.taxableIncome, countyBrackets, countyJurisdiction)
            : this.calculateBracketBreakdown(state.taxableIncome, countyBrackets, countyJurisdiction);
        
        return {
            federal: federalBreakdown,
            state: stateBreakdown,
            county: countyBreakdown
        };
    }
}