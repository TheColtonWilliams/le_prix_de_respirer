/**
 * Jurisdiction Data Module
 * State income tax brackets, state standard deductions and county (local) income tax brackets
 * for every supported state. Pure data - no DOM access and no calculation logic.
 *
 * Tax year: 2025 (see TAX_YEAR below)
 * Bracket format: [upperLimit, rate] pairs with CUMULATIVE upper limits, the same format TaxCalculator uses.
 * Sources:
 *   - Maryland state rates and standard deduction: Comptroller of Maryland, 2025 Maryland Resident Tax Booklet (Form 502 instructions: Instruction 16 standard deduction, Instruction 17 tax rate schedules) and Tax Alert "Changes to Standard and Itemized Deductions and to State and Local Income Tax Rates from the 2025 Legislative Session" (revised December 22, 2025)
 *   - Maryland county rates: the same booklet's Instruction 19 local tax rate chart; the Tax Alert and the 2025 Withholding Tax Facts list the counties whose 2025 rates changed (Anne Arundel, Calvert, Cecil, Dorchester, St. Mary's)
 *   - Virginia rates and standard deduction: Virginia Tax, 2025 Form 760 Resident Individual Income Tax Instructions
 *   - Virginia has no local income tax: Code of Virginia section 58.1-300
 *   - County and independent-city names: U.S. Census Bureau 2020 county FIPS lists
 * Not modelled: personal exemptions (Maryland $3,200, Virginia $930, per person), Maryland's 2% surtax on net capital gains
 * when federal AGI exceeds $350,000, Maryland's itemized-deduction phase-out, and Virginia's spouse tax adjustment.
 *
 * To add a state: add an entry to STATES with the same keys as MD and VA below (code, name, brackets,
 * standardDeduction, countyLabel, counties, defaultCounty as a county slug code, countyNote), and a radio
 * button for it in index.html whose value equals the state code. See .github/copilot-instructions.md.
 */

export const DEFAULT_STATE_CODE = 'MD';

// The tax year of every rate and standard deduction in the app (the federal ones in taxCalculator.js must match)
export const TAX_YEAR = 2025;

// Filing status codes used by the UI (the radio values) mapped to the keys of the bracket and deduction tables
const FILING_STATUS_KEYS = { 1: 'single', 2: 'married' };

/**
 * Get the table key for a filing status
 * @param {number|string} filingStatus - 1 for single, 2 for married
 * @returns {string} 'single' or 'married'
 */
export function filingStatusKey(filingStatus) {
    if (!Object.hasOwn(FILING_STATUS_KEYS, filingStatus)) throw new Error(`Unknown filing status: ${filingStatus}`);
    return FILING_STATUS_KEYS[filingStatus];
}

const flat =(rate) => ({ single: [[Infinity, rate]], married: [[Infinity, rate]] });

const slugify = (name) => name.toLowerCase().replace(/['.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// options.group puts the county in a dropdown group; options.wholeIncome marks brackets that are not marginal
const county = (name, brackets, { group, wholeIncome = false } = {}) => ({ code: slugify(name), name, group, wholeIncome, brackets });

const MARYLAND_COUNTIES = [
    county('Allegany County', flat(0.0303)),
    // Graduated and marginal: each rate applies only to the income inside its bracket.
    county('Anne Arundel County', {
        single: [[50000, 0.027], [400000, 0.0294], [Infinity, 0.032]],
        married: [[75000, 0.027], [480000, 0.0294], [Infinity, 0.032]]
    }),
    county('Baltimore City', flat(0.032)),
    county('Baltimore County', flat(0.032)),
    county('Calvert County', flat(0.032)),
    county('Caroline County', flat(0.032)),
    county('Carroll County', flat(0.0303)),
    county('Cecil County', flat(0.0274)),
    county('Charles County', flat(0.0303)),
    // 3.30% for 2025: Ch. 604 of 2025 (Sec. 28) let Dorchester raise its rate retroactively; the Comptroller's January 2025
    // rate chart and payroll memo (and the DLS January 2025 table) pre-date that and still show 3.20%.
    county('Dorchester County', flat(0.033)),
    // Graduated, but NOT marginal: the rate of the bracket your TOTAL taxable income falls in applies to ALL of it,
    // so the tax jumps at each threshold (wholeIncome: true). Basis (tax year 2025): Local Tax Worksheet 19A in the 2025
    // booklet multiplies taxable net income by ONE rate, and the Frederick note under the rate chart picks that rate by the
    // taxpayer's taxable net income; the Comptroller's own 2025 Estimated Tax Calculator agrees (taxable income $25,001
    // gives $687.53, $150,001 gives $4,800.03). Only Anne Arundel gets a slice formula. No State document says
    // "applies to all income" in those words. Re-check this when refreshing the tax year.
    county('Frederick County', {
        single: [[25000, 0.0225], [50000, 0.0275], [150000, 0.0296], [Infinity, 0.032]],
        married: [[25000, 0.0225], [100000, 0.0275], [250000, 0.0296], [Infinity, 0.032]]
    }, { wholeIncome: true }),
    county('Garrett County', flat(0.0265)),
    county('Harford County', flat(0.0306)),
    county('Howard County', flat(0.032)),
    county('Kent County', flat(0.032)),
    county('Montgomery County', flat(0.032)),
    county('Prince George\'s County', flat(0.032)),
    county('Queen Anne\'s County', flat(0.032)),
    county('Somerset County', flat(0.032)),
    county('St. Mary\'s County', flat(0.032)),
    county('Talbot County', flat(0.024)),
    county('Washington County', flat(0.0295)),
    county('Wicomico County', flat(0.032)),
    county('Worcester County', flat(0.0225)),
];

// Virginia counties and independent cities (95 + 38, per the U.S. Census Bureau).
// Virginia localities cannot levy an individual income tax (Code of Virginia section 58.1-300), so every local rate is 0.
const VIRGINIA_COUNTY_NAMES = [
    'Accomack County', 'Albemarle County', 'Alleghany County', 'Amelia County', 'Amherst County', 'Appomattox County',
    'Arlington County', 'Augusta County', 'Bath County', 'Bedford County', 'Bland County', 'Botetourt County',
    'Brunswick County', 'Buchanan County', 'Buckingham County', 'Campbell County', 'Caroline County',
    'Carroll County', 'Charles City County', 'Charlotte County', 'Chesterfield County', 'Clarke County',
    'Craig County', 'Culpeper County', 'Cumberland County', 'Dickenson County', 'Dinwiddie County', 'Essex County',
    'Fairfax County', 'Fauquier County', 'Floyd County', 'Fluvanna County', 'Franklin County', 'Frederick County',
    'Giles County', 'Gloucester County', 'Goochland County', 'Grayson County', 'Greene County', 'Greensville County',
    'Halifax County', 'Hanover County', 'Henrico County', 'Henry County', 'Highland County', 'Isle of Wight County',
    'James City County', 'King and Queen County', 'King George County', 'King William County', 'Lancaster County',
    'Lee County', 'Loudoun County', 'Louisa County', 'Lunenburg County', 'Madison County', 'Mathews County',
    'Mecklenburg County', 'Middlesex County', 'Montgomery County', 'Nelson County', 'New Kent County',
    'Northampton County', 'Northumberland County', 'Nottoway County', 'Orange County', 'Page County',
    'Patrick County', 'Pittsylvania County', 'Powhatan County', 'Prince Edward County', 'Prince George County',
    'Prince William County', 'Pulaski County', 'Rappahannock County', 'Richmond County', 'Roanoke County',
    'Rockbridge County', 'Rockingham County', 'Russell County', 'Scott County', 'Shenandoah County', 'Smyth County',
    'Southampton County', 'Spotsylvania County', 'Stafford County', 'Surry County', 'Sussex County',
    'Tazewell County', 'Warren County', 'Washington County', 'Westmoreland County', 'Wise County', 'Wythe County',
    'York County',
];

const VIRGINIA_CITY_NAMES = [
    'Alexandria City', 'Bristol City', 'Buena Vista City', 'Charlottesville City', 'Chesapeake City',
    'Colonial Heights City', 'Covington City', 'Danville City', 'Emporia City', 'Fairfax City', 'Falls Church City',
    'Franklin City', 'Fredericksburg City', 'Galax City', 'Hampton City', 'Harrisonburg City', 'Hopewell City',
    'Lexington City', 'Lynchburg City', 'Manassas City', 'Manassas Park City', 'Martinsville City',
    'Newport News City', 'Norfolk City', 'Norton City', 'Petersburg City', 'Poquoson City', 'Portsmouth City',
    'Radford City', 'Richmond City', 'Roanoke City', 'Salem City', 'Staunton City', 'Suffolk City',
    'Virginia Beach City', 'Waynesboro City', 'Williamsburg City', 'Winchester City',
];

const VIRGINIA_COUNTIES = [
    ...VIRGINIA_COUNTY_NAMES.map(name => county(name, flat(0), { group: 'Counties' })),
    ...VIRGINIA_CITY_NAMES.map(name => county(name, flat(0), { group: 'Independent Cities' }))
];

export const STATES = {
    MD: {
        code: 'MD',
        name: 'Maryland',
        brackets: { single: [[1000, 0.02], [2000, 0.03], [3000, 0.04], [100000, 0.0475], [125000, 0.05], [150000, 0.0525], [250000, 0.055], [500000, 0.0575], [1000000, 0.0625], [Infinity, 0.065]], married: [[1000, 0.02], [2000, 0.03], [3000, 0.04], [150000, 0.0475], [175000, 0.05], [225000, 0.0525], [300000, 0.055], [600000, 0.0575], [1200000, 0.0625], [Infinity, 0.065]] },
        standardDeduction: { single: 3350, married: 6700 },
        countyLabel: 'County',
        countyNote: null,
        counties: MARYLAND_COUNTIES,
        defaultCounty: 'anne-arundel-county'
    },
    VA: {
        code: 'VA',
        name: 'Virginia',
        brackets: { single: [[3000, 0.02], [5000, 0.03], [17000, 0.05], [Infinity, 0.0575]], married: [[3000, 0.02], [5000, 0.03], [17000, 0.05], [Infinity, 0.0575]] },
        standardDeduction: { single: 8750, married: 17500 },
        countyLabel: 'County or Independent City',
        countyNote: 'Virginia counties and independent cities do not levy a local income tax, so this choice does not change your income tax.',
        counties: VIRGINIA_COUNTIES,
        defaultCounty: 'fairfax-county'
    }
};

const countyIndex = {};
for (const state of Object.values(STATES)) {
    countyIndex[state.code] = Object.fromEntries(state.counties.map(c => [c.code, c]));
}

/**
 * Get a state's data
 * @param {string} [stateCode] - State code ('MD' or 'VA'); defaults to DEFAULT_STATE_CODE
 * @returns {Object} State data
 */
export function getStateData(stateCode = DEFAULT_STATE_CODE) {
    const state = STATES[stateCode];
    if (!state) throw new Error(`Unknown state code: ${stateCode}`);
    return state;
}

/**
 * Get a county's data
 * @param {string} [stateCode] - State code; defaults to DEFAULT_STATE_CODE
 * @param {string} [countyCode] - County code; defaults to the state's default county
 * @returns {Object} County data
 */
export function getCountyData(stateCode = DEFAULT_STATE_CODE, countyCode) {
    const state = getStateData(stateCode);
    const code = countyCode === undefined ? state.defaultCounty : countyCode;
    const found = countyIndex[state.code][code];
    if (!found) throw new Error(`Unknown county code for ${state.code}: ${code}`);
    return found;
}

/**
 * Get the lowest and highest local income tax rate a county charges (across both filing statuses)
 * @param {Object} county - County data
 * @returns {{min: number, max: number}} Rate range as decimals
 */
export function getRateRange(county) {
    const rates = [...county.brackets.single, ...county.brackets.married].map(([, rate]) => rate);
    return { min: Math.min(...rates), max: Math.max(...rates) };
}
