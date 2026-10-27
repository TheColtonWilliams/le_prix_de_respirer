# Federal, State & County Tax Visualization Tool

An interactive, mobile-first calculator that shows how federal, state and county income taxes take a share of an income. It is plain HTML, CSS and JavaScript ES modules: no build step and no dependencies. A State toggle switches between Maryland and Virginia, and a County dropdown picks the locality. Rates and standard deductions are for **tax year 2025**.

## Running It

ES modules do not load from `file://`, so serve the folder over HTTP:

```
python3 -m http.server 8000
```

and open `http://localhost:8000`. If the page is opened as a file, or the calculator fails to start, a banner at the top of the page says so (the browser console has the details). `example.html` shows the calculator, display and theme modules used on their own.

## Project Structure

```
├── index.html          # Main HTML file
├── example.html        # The calculator, display and theme modules used on their own
├── styles.css          # All styling (light and dark themes)
├── favicon.svg         # Tab icon
├── js/
│   ├── main.js              # Main application coordinator
│   ├── taxCalculator.js     # Tax calculation logic
│   ├── jurisdictionData.js  # State and county tax data (Maryland, Virginia)
│   ├── uiControls.js        # Input controls and form handling
│   ├── displayManager.js    # Display updates and visualization
│   ├── tabManager.js        # Tab navigation
│   └── themeManager.js      # Dark/light mode functionality
└── README.md
```

## How the Pieces Fit Together

The code is split into ES modules with small public interfaces, but the modules are not independent of `index.html` or of each other. `UIControls` and `DisplayManager` look up elements by id when they are created, and `main.js` calls specific methods on each module. A replacement module has to provide the same methods and read or write the same elements.

| Module | Methods `main.js` calls |
| --- | --- |
| `TaxCalculator` | `calculateAllTaxes`, `calculateBaseline`, `calculateStateBaseline`; `DisplayManager.updateBracketBreakdown` also calls `getCompleteTaxBreakdown` on the instance it is given |
| `UIControls` | `getValues`, `setValues`, `reset`, `enable`, `disable`, `syncJurisdiction`, and the update callback it is created with |
| `DisplayManager` | `updateJurisdiction`, `updateAll`, `updateBracketBreakdown` |
| `ThemeManager` | `getCurrentTheme`, `setTheme` |
| `TabManager` | `getActiveTab`, and the `tabChanged` event it dispatches |

`TaxCalculator` and `jurisdictionData.js` do not touch the DOM, so they can be imported anywhere that runs ES modules, including Node, for testing. `window.taxCalculatorApp` (the `TaxCalculatorApp` instance, with `getState`, `setState`, `reset`, `enable` and `disable`) is exposed for debugging and browser automation.

If an element id that a module needs is missing from `index.html`, `main.js` logs a console error at startup for each module (`DisplayManager`, `UIControls`) that cannot find elements, listing the missing ids.

## Modules

### 1. TaxCalculator (`js/taxCalculator.js`)
Handles all tax calculation logic:
- Federal tax bracket calculations (2025 brackets and standard deductions)
- State and county tax calculations for the selected state and county
- Each state's own standard deduction
- AGI and taxable income computations
- Baseline scenario calculations

`taxCalculator.js` imports `./jurisdictionData.js` for the state and county data, so the two files go together.

All amounts are whole dollars, as on a tax return: inputs are rounded to whole dollars (negative and non-numeric amounts count as 0), and each tax is rounded once, so the figures shown for the parts always add up to the figures shown for the totals. The per-bracket rows of a breakdown are rounded so that they add up to the bracket total. Adjustments, deductions and credits can only use what is available (they cannot take AGI, taxable income or tax below zero), and the results report the amounts actually applied. A filing status other than `1` or `2` throws.

**Usage:**
```javascript
import { TaxCalculator } from './js/taxCalculator.js';

const calculator = new TaxCalculator();
const result = calculator.calculateTaxes({
    income: 75000,
    adjustments: 0,
    deductions: 0,
    credits: 2000,
    filingStatus: 2 // 1 = single, 2 = married
});

// Federal + state + county. stateCode / countyCode are optional and
// default to Maryland / Anne Arundel County.
const all = calculator.calculateAllTaxes({
    federalIncome: 75000, federalAdjustments: 0, federalDeductions: 0, federalCredits: 0,
    stateIncome: 75000, stateAdjustments: 0, stateDeductions: 0, stateCredits: 0,
    filingStatus: 2,
    stateCode: 'VA',
    countyCode: 'fairfax-county'
});
// all.federal, all.state: { income, agi, taxableIncome, preCreditTax, totalTax, effectiveRate,
//                           adjustmentsApplied, deductionsApplied, creditsApplied }
// all.county:             { totalTax, effectiveRate }
// all.totals:             { totalTax, postTaxIncome, effectiveRate, primaryIncome,
//                           shares: { federal, state, county, takeHome } }  // percentages of primaryIncome
```

Federal and state gross income are separate inputs. `primaryIncome` is the larger of the two; the totals, the Income Breakdown bar and the take-home pay are all shares of it, so they always agree.

### 2. UIControls (`js/uiControls.js`)
Manages all input controls and form interactions:
- Slider and input field synchronization (one update per edit)
- Limits: amounts are kept between the `min` and `max` the fields declare ($0 to $1,000,000); an entry outside them is replaced by the nearest limit, with a note
- The State toggle and the County dropdown (the dropdown is refilled for the selected state)
- Form value getters and setters (including `stateCode` and `countyCode`)
- Accessible names for the sliders and groups, and dollar values for screen readers

**Usage:**
```javascript
import { UIControls } from './js/uiControls.js';

const controls = new UIControls(() => {
    // This callback runs when any input changes
    console.log('Input changed:', controls.getValues());
});
```

### 3. DisplayManager (`js/displayManager.js`)
Handles all display updates and visualizations:
- Currency formatting
- Visual calculation flow updates (the boxes show the amounts actually applied, with a note when part of an entry could not be used)
- Baseline comparison displays
- Income breakdown visualization
- State and county names (labels, tab name, page title, legend) and the county rate description

**Usage:**
```javascript
import { DisplayManager } from './js/displayManager.js';

const display = new DisplayManager();
display.updateJurisdiction(state, county, filingStatus); // state / county from jurisdictionData.js
display.updateAll(
    calculationResults,        // from TaxCalculator.calculateAllTaxes()
    inputValues,               // from UIControls.getValues()
    baselineResults,           // federal baseline, from TaxCalculator.calculateBaseline(), or null
    stateBaselineResults       // from TaxCalculator.calculateStateBaseline(), or null
);
display.updateBracketBreakdown(inputValues, calculator); // fills the three bracket tables
```

The ids and classes on the state and county elements (`state-visual-*`, `state-baseline-*`, `state-bracket-table`, `county-bracket-table`, `calc-state-*`, `calc-county-*`) are generic: they belong to whichever state and county are selected, and their visible names come from `<span data-state-name>` and `<span data-county-name>`.

### 4. ThemeManager (`js/themeManager.js`)
Manages dark/light mode functionality:
- The theme is the user's saved choice, otherwise the operating system's setting (which is followed as it changes until a choice is made)
- Only an explicit choice is saved (key `le-prix-de-respirer:theme`), and saving is best effort: blocked storage never stops the calculator
- `index.html` applies the saved or system theme from a small inline script before first paint, so dark mode never flashes light

**Usage:**
```javascript
import { ThemeManager } from './js/themeManager.js';

const theme = new ThemeManager();
theme.setTheme('dark'); // or 'light' (this is remembered)
```

### 5. TabManager (`js/tabManager.js`)
Switches between the four views (Calculator, Federal Tax Math, state Tax Math, Tax Bracket Breakdown). The tabs follow the WAI-ARIA tabs pattern: `role="tablist"` / `tab` / `tabpanel`, only the selected tab is in the tab order, and Left/Right arrows (wrapping), Home and End move between tabs. `setActiveTab(name, { focus })` only moves keyboard focus when asked to; it dispatches a `tabChanged` event. The tab names are listed once, in `TAB_NAMES`.

### 6. Jurisdiction Data (`js/jurisdictionData.js`)
Holds the data for every supported state (currently Maryland and Virginia), with no DOM access and no calculation logic:
- State income tax brackets (single and married)
- Each state's own standard deduction (flat amounts)
- Every county's local income tax brackets (Maryland: 23 counties plus Baltimore City; Virginia: 95 counties plus 38 independent cities)
- `TAX_YEAR`, the tax year of all of the above (shown in the page header)

Brackets are `[upperLimit, rate]` pairs with cumulative upper limits, the same format `TaxCalculator` uses. Virginia localities do not levy an income tax, so every Virginia county is listed with a 0% rate.

**Usage:**
```javascript
import { getStateData, getCountyData } from './js/jurisdictionData.js';

const state = getStateData('MD');                      // { code, name, brackets, standardDeduction, countyLabel, countyNote, counties, defaultCounty }
const county = getCountyData('MD', 'frederick-county'); // { code, name, group, wholeIncome, brackets }
```

`wholeIncome: true` marks a county whose graduated rates are not marginal: the rate of the bracket your whole taxable income falls in applies to all of it (Frederick County, MD). No State document states this in those words; it rests on Form 502 line 28 / Local Tax Worksheet 19A, the Frederick note under the Comptroller's rate chart, and the Comptroller's own Estimated Tax Calculator, so re-check it when refreshing the tax year. The sources of all the data are listed in the file header.

**Adding a state:** add an entry to `STATES` with the same keys the Maryland and Virginia entries have (`code`, `name`, `brackets`, `standardDeduction`, `countyLabel`, `counties`, `defaultCounty` as the county's slug code, and `countyNote`) and a radio button for it in the State toggle in `index.html` (its `value` must equal the state `code`). See `.github/copilot-instructions.md` for the full recipe.

### 7. Main Application (`js/main.js`)
Coordinates all components and manages application state:
- Initializes all modules
- Handles inter-component communication
- Provides the global `window.taxCalculatorApp` API

## Tax Year and Refreshing the Data

Everything is **tax year 2025**: the federal brackets and standard deductions in `taxCalculator.js` (IRS Rev. Proc. 2024-40 and P.L. 119-21), and the Maryland and Virginia data in `jurisdictionData.js`. To move to another year, update all of these together:

1. `this.federalBrackets` and `this.standardDeductions` in `taxCalculator.js`
2. Each state's `brackets` and `standardDeduction`, and every county's rates, in `jurisdictionData.js`
3. `TAX_YEAR` and the sources in the header of `jurisdictionData.js`
4. Re-check that Frederick County's `wholeIncome` method still holds, and that no Maryland county has changed its structure (Anne Arundel is marginal with three brackets)
5. The expected results in `.github/copilot-instructions.md`

Changes already known for tax year 2026 (not in the app yet): the federal brackets and standard deduction ($16,100 single, $32,200 married; IRS Rev. Proc. 2025-32), Allegany County 3.03% to 3.20% and Kent County 3.20% to 3.30%. Maryland's standard deduction is indexed to inflation from 2026 and the amount was not final when this was written; Virginia's stays $8,750 / $17,500.

## What Is and Is Not Modelled

- Federal and state tax come from the brackets, the standard deduction or the deductions you enter, adjustments and credits. The county tax is on state taxable income.
- The baseline comparisons use the standard deduction only. Personal exemptions (Maryland $3,200, Virginia $930, per person), itemized-deduction limits, Maryland's 2% surtax on net capital gains above $350,000 of federal AGI, Virginia's spouse tax adjustment, payroll taxes and credits are not modelled.
- Filing status is Single or Married filing jointly.
- Virginia counties and independent cities do not levy an income tax, so the county tax there is always $0.

## Development Guidelines

### Adding New Features
1. Determine which module the feature belongs to
2. If it doesn't fit existing modules, create a new one
3. Update the main application to use the new module
4. Maintain the same interface pattern for consistency

### Modifying Existing Features
1. Locate the appropriate module
2. Make changes within that module, and keep the methods `main.js` calls (see the table above) compatible
3. Check the page in a browser: light and dark themes, a phone-width window, and the four tabs

### Creating New Modules
1. Export a class with clear public methods
2. Keep internal implementation private
3. Document the public interface
4. Follow the same patterns as existing modules
