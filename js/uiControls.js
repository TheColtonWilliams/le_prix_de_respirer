/**
 * UI Controls Module
 * Handles input controls, sliders, and form interactions
 */

import { DEFAULT_STATE_CODE, getStateData, getRateRange } from './jurisdictionData.js';

export class UIControls {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.elements = this.initializeElements();
        // Remember each state's last-picked county while the user toggles between states
        this.selectedCounties = {};
        this.populatedStateCode = null; // which state's counties the dropdown currently lists
        this.populateCounties(this.getSelectedStateCode());
        this.setupEventListeners();
    }

    /**
     * Initialize DOM element references
     * @returns {Object} Object containing DOM element references
     */
    initializeElements() {
        return {
            // Federal controls
            federalIncomeSlider: document.getElementById('federal-income-slider'),
            federalIncomeInput: document.getElementById('federal-income-input'),
            federalAdjustmentsSlider: document.getElementById('federal-adjustments-slider'),
            federalAdjustmentsInput: document.getElementById('federal-adjustments-input'),
            federalDeductionsSlider: document.getElementById('federal-deductions-slider'),
            federalDeductionsInput: document.getElementById('federal-deductions-input'),
            federalCreditsSlider: document.getElementById('federal-credits-slider'),
            federalCreditsInput: document.getElementById('federal-credits-input'),
            
            // State controls
            stateIncomeSlider: document.getElementById('state-income-slider'),
            stateIncomeInput: document.getElementById('state-income-input'),
            stateAdjustmentsSlider: document.getElementById('state-adjustments-slider'),
            stateAdjustmentsInput: document.getElementById('state-adjustments-input'),
            stateDeductionsSlider: document.getElementById('state-deductions-slider'),
            stateDeductionsInput: document.getElementById('state-deductions-input'),
            stateCreditsSlider: document.getElementById('state-credits-slider'),
            stateCreditsInput: document.getElementById('state-credits-input'),
            
            // Common controls
            filingStatusRadios: document.querySelectorAll('input[name="filingStatus"]'),

            // Jurisdiction controls
            stateRadios: document.querySelectorAll('input[name="stateSelect"]'),
            countySelect: document.getElementById('county-select'),
            countySelectLabel: document.getElementById('county-select-label')
        };
    }

    /**
     * Set up event listeners for all controls
     */
    setupEventListeners() {
        // Set up federal controls
        this.setupInputSync(this.elements.federalIncomeSlider, this.elements.federalIncomeInput);
        this.setupInputSync(this.elements.federalAdjustmentsSlider, this.elements.federalAdjustmentsInput);
        this.setupInputSync(this.elements.federalDeductionsSlider, this.elements.federalDeductionsInput);
        this.setupInputSync(this.elements.federalCreditsSlider, this.elements.federalCreditsInput);
        
        // Set up state controls
        this.setupInputSync(this.elements.stateIncomeSlider, this.elements.stateIncomeInput);
        this.setupInputSync(this.elements.stateAdjustmentsSlider, this.elements.stateAdjustmentsInput);
        this.setupInputSync(this.elements.stateDeductionsSlider, this.elements.stateDeductionsInput);
        this.setupInputSync(this.elements.stateCreditsSlider, this.elements.stateCreditsInput);

        // Set up filing status change listener
        this.elements.filingStatusRadios.forEach(radio => 
            radio.addEventListener('change', () => this.updateCallback())
        );

        // Set up state toggle and county dropdown listeners
        this.elements.stateRadios.forEach(radio =>
            radio.addEventListener('change', () => {
                this.populateCounties(radio.value, this.selectedCounties[radio.value]);
                this.updateCallback();
            })
        );
        this.elements.countySelect.addEventListener('change', () => {
            this.selectedCounties[this.getSelectedStateCode()] = this.elements.countySelect.value;
            this.updateCallback();
        });
    }

    /**
     * Get the code of the state currently selected in the toggle
     * @returns {string} State code (e.g. 'MD', 'VA')
     */
    getSelectedStateCode() {
        const checked = document.querySelector('input[name="stateSelect"]:checked');
        return checked ? checked.value : DEFAULT_STATE_CODE;
    }

    /**
     * Fill the county dropdown with a state's counties (and independent cities)
     * @param {string} stateCode - State whose counties to list
     * @param {string} [countyCode] - County to select; defaults to the state's default county
     */
    populateCounties(stateCode, countyCode) {
        const state = getStateData(stateCode);
        const select = this.elements.countySelect;
        const groups = new Map();

        select.innerHTML = '';
        this.elements.countySelectLabel.textContent = state.countyLabel;

        state.counties.forEach(county => {
            const option = document.createElement('option');
            option.value = county.code;
            const rateRange = this.describeRateRange(county);
            option.textContent = rateRange ? `${county.name} — ${rateRange}` : county.name;

            let parent = select;
            if (county.group) {
                if (!groups.has(county.group)) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = county.group;
                    select.appendChild(optgroup);
                    groups.set(county.group, optgroup);
                }
                parent = groups.get(county.group);
            }
            parent.appendChild(option);
        });

        const isListed = state.counties.some(county => county.code === countyCode);
        select.value = isListed ? countyCode : state.defaultCounty;
        this.selectedCounties[state.code] = select.value;
        this.populatedStateCode = state.code;
    }

    /**
     * Re-sync the county dropdown with the state toggle. Browsers restore form values (history
     * navigation, session restore) without firing events, so the toggle can disagree with the listed counties.
     */
    syncJurisdiction() {
        const stateCode = this.getSelectedStateCode();
        if (stateCode !== this.populatedStateCode) {
            this.populateCounties(stateCode, this.selectedCounties[stateCode]);
        } else {
            this.selectedCounties[stateCode] = this.elements.countySelect.value;
        }
    }

    /**
     * Describe a county's local income tax rate(s) for its dropdown entry
     * @param {Object} county - County data
     * @returns {string} e.g. "3.20%" or "2.25%–3.20%"; empty when the county levies no local income tax
     *     (the County note under the dropdown explains that once, instead of repeating it on every option)
     */
    describeRateRange(county) {
        const { min, max } = getRateRange(county);
        if (max === 0) return '';
        const percent = (rate) => (rate * 100).toFixed(2) + '%';
        return min === max ? percent(max) : `${percent(min)}–${percent(max)}`;
    }

    /**
     * Keep a number inside the limits an input declares (its min and max attributes)
     * @param {HTMLInputElement} input - Input that declares the limits
     * @param {number} value - Value to limit
     * @returns {number} Value between min and max; anything that is not a number counts as 0
     */
    clampToLimits(input, value) {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        const number = Number.isFinite(value) ? value : 0;
        return Math.min(Number.isNaN(max) ? Infinity : max, Math.max(Number.isNaN(min) ? -Infinity : min, number));
    }

    /**
     * Read a number field, kept inside its limits
     * @param {HTMLInputElement} input - Number input
     * @returns {number} Value between min and max; an empty or invalid field counts as 0
     */
    readNumber(input) {
        return this.clampToLimits(input, parseFloat(input.value));
    }

    /**
     * Show the slider's value to assistive technology as dollars rather than a bare number
     * @param {HTMLInputElement} slider - Range input
     */
    updateSliderText(slider) {
        slider.setAttribute('aria-valuetext', '$' + Number(slider.value).toLocaleString('en-US'));
    }

    /**
     * Show or hide the note (in the input's tax section) that says an entry was moved into the allowed range
     * @param {HTMLInputElement} input - Number input that was edited
     * @param {number} [adjustedTo] - The limit the entry was changed to; omit to hide the note
     */
    updateLimitNote(input, adjustedTo) {
        const note = input.closest('.tax-section')?.querySelector('[data-limit-note]');
        if (!note) return;

        const format = (amount) => '$' + amount.toLocaleString('en-US');
        note.hidden = adjustedTo === undefined;
        note.textContent = adjustedTo === undefined
            ? ''
            : `Amounts can be ${format(parseFloat(input.min))} to ${format(parseFloat(input.max))}. Your entry was changed to ${format(adjustedTo)}.`;
    }

    /**
     * Synchronize slider and input field values
     * @param {HTMLElement} slider - Slider element
     * @param {HTMLElement} input - Input element
     */
    setupInputSync(slider, input) {
        // Update input when slider changes
        slider.addEventListener('input', () => {
            input.value = slider.value;
            this.updateSliderText(slider);
            this.updateLimitNote(input);
            this.updateCallback();
        });

        // Update slider and trigger calculations as the user types or steps the number
        input.addEventListener('input', () => {
            const typed = parseFloat(input.value);
            const value = this.clampToLimits(input, typed);
            const outsideLimits = !Number.isNaN(typed) && value !== typed;

            // The calculation uses the limited value, so show it instead of leaving an impossible number in the field
            if (outsideLimits) {
                input.value = value;
            }
            slider.value = value;
            this.updateSliderText(slider);
            this.updateLimitNote(input, outsideLimits ? value : undefined);
            this.updateCallback();
        });

        // Amounts are never negative and never need exponent notation, so keep those characters out of the field
        // (a pasted value is still limited by the input handler above)
        input.addEventListener('keydown', (event) => {
            if (!event.ctrlKey && !event.metaKey && !event.altKey && ['-', '+', 'e', 'E'].includes(event.key)) {
                event.preventDefault();
            }
        });

        // 'change' fires after the 'input' events when the user leaves the field, so it only tidies what is shown
        input.addEventListener('change', () => {
            input.value = this.readNumber(input);
        });

        this.updateSliderText(slider);
    }

    /**
     * Put a value into a slider and its number field, kept inside the field's limits
     * @param {HTMLInputElement} slider - Range input
     * @param {HTMLInputElement} input - Number input
     * @param {number} value - Value to set
     */
    setPair(slider, input, value) {
        const limited = this.clampToLimits(input, value);
        slider.value = limited;
        input.value = limited;
        this.updateSliderText(slider);
    }

    /**
     * Get current values from all controls
     * @returns {Object} Current form values
     */
    getValues() {
        return {
            // Federal values
            federalIncome: this.readNumber(this.elements.federalIncomeInput),
            federalAdjustments: this.readNumber(this.elements.federalAdjustmentsInput),
            federalDeductions: this.readNumber(this.elements.federalDeductionsInput),
            federalCredits: this.readNumber(this.elements.federalCreditsInput),
            
            // State values
            stateIncome: this.readNumber(this.elements.stateIncomeInput),
            stateAdjustments: this.readNumber(this.elements.stateAdjustmentsInput),
            stateDeductions: this.readNumber(this.elements.stateDeductionsInput),
            stateCredits: this.readNumber(this.elements.stateCreditsInput),
            
            // Common values
            filingStatus: parseInt(document.querySelector('input[name="filingStatus"]:checked').value),

            // Jurisdiction values
            stateCode: this.getSelectedStateCode(),
            countyCode: this.elements.countySelect.value
        };
    }

    /**
     * Set values for all controls
     * @param {Object} values - Values to set
     */
    setValues(values) {
        // Federal values
        if (values.federalIncome !== undefined) {
            this.setPair(this.elements.federalIncomeSlider, this.elements.federalIncomeInput, values.federalIncome);
        }
        if (values.federalAdjustments !== undefined) {
            this.setPair(this.elements.federalAdjustmentsSlider, this.elements.federalAdjustmentsInput, values.federalAdjustments);
        }
        if (values.federalDeductions !== undefined) {
            this.setPair(this.elements.federalDeductionsSlider, this.elements.federalDeductionsInput, values.federalDeductions);
        }
        if (values.federalCredits !== undefined) {
            this.setPair(this.elements.federalCreditsSlider, this.elements.federalCreditsInput, values.federalCredits);
        }
        
        // State values
        if (values.stateIncome !== undefined) {
            this.setPair(this.elements.stateIncomeSlider, this.elements.stateIncomeInput, values.stateIncome);
        }
        if (values.stateAdjustments !== undefined) {
            this.setPair(this.elements.stateAdjustmentsSlider, this.elements.stateAdjustmentsInput, values.stateAdjustments);
        }
        if (values.stateDeductions !== undefined) {
            this.setPair(this.elements.stateDeductionsSlider, this.elements.stateDeductionsInput, values.stateDeductions);
        }
        if (values.stateCredits !== undefined) {
            this.setPair(this.elements.stateCreditsSlider, this.elements.stateCreditsInput, values.stateCredits);
        }
        
        // Common values
        if (values.filingStatus !== undefined) {
            const radio = document.querySelector(`input[name="filingStatus"][value="${values.filingStatus}"]`);
            if (radio) radio.checked = true;
        }

        // Jurisdiction values (state first: it decides which counties are listed)
        if (values.stateCode !== undefined) {
            const radio = document.querySelector(`input[name="stateSelect"][value="${values.stateCode}"]`);
            if (radio) {
                radio.checked = true;
                this.populateCounties(values.stateCode, values.countyCode);
            }
        } else if (values.countyCode !== undefined) {
            // Same validated path as above: a code that is not listed falls back to the state's default county
            this.populateCounties(this.getSelectedStateCode(), values.countyCode);
        }
    }

    /**
     * Reset all controls to default values
     */
    reset() {
        this.selectedCounties = {};
        this.setValues({
            federalIncome: 0,
            federalAdjustments: 0,
            federalDeductions: 0,
            federalCredits: 0,
            stateIncome: 0,
            stateAdjustments: 0,
            stateDeductions: 0,
            stateCredits: 0,
            filingStatus: 2, // Default to married
            stateCode: DEFAULT_STATE_CODE // Also resets to that state's default county
        });
        this.updateCallback();
    }

    /**
     * Disable all controls
     */
    disable() {
        Object.values(this.elements).forEach(element => {
            if (element instanceof NodeList) {
                element.forEach(node => node.disabled = true);
            } else {
                element.disabled = true;
            }
        });
    }

    /**
     * Enable all controls
     */
    enable() {
        Object.values(this.elements).forEach(element => {
            if (element instanceof NodeList) {
                element.forEach(node => node.disabled = false);
            } else {
                element.disabled = false;
            }
        });
    }
}