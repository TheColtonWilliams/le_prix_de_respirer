# Federal & State Tax Calculator (Le Prix de Respirer)

Federal & State Tax Calculator is a static web application built with pure HTML, CSS, and JavaScript ES6 modules. It calculates federal, state, and county income taxes for tax year 2025 with an interactive, mobile-first design. A State toggle switches between Maryland (23 counties plus Baltimore City, with their own local income tax rates) and Virginia (95 counties and 38 independent cities, none of which levy an income tax), and a County dropdown picks the locality.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Run the Application:
- **INSTANT SETUP**: No dependencies to install, no build process required
- Start local development server: `python3 -m http.server 8000` -- starts immediately (2 seconds max)
- Navigate to: `http://localhost:8000` for main calculator
- Navigate to: `http://localhost:8000/example.html` for modular usage examples
- **NEVER CANCEL**: Allow server to run continuously during development

### File Structure:
```
├── index.html              # Main calculator interface
├── example.html            # Module usage demonstration
├── styles.css              # Mobile-first CSS (no frameworks)
├── favicon.svg             # Tab icon
├── js/
│   ├── main.js              # Application coordinator
│   ├── taxCalculator.js     # Tax calculation logic
│   ├── jurisdictionData.js  # State and county tax data (Maryland, Virginia)
│   ├── uiControls.js        # Input controls, state toggle, county dropdown
│   ├── displayManager.js    # Display updates
│   ├── themeManager.js      # Dark/light mode
│   └── tabManager.js        # Tab navigation
├── README.md              # Architecture documentation
└── LICENSE                # MIT License
```

### Development Workflow:
- Edit files directly -- changes appear immediately on browser refresh
- No compilation, bundling, or build steps required
- No package.json, no dependencies, no node_modules
- **TESTING**: Manual browser testing only -- no automated test framework in the repository. `taxCalculator.js` and `jurisdictionData.js` do not touch the DOM, so the numbers can also be checked from Node by importing them

## Validation

### Manual Testing Requirements:
**ALWAYS test these complete scenarios after making changes:**

1. **Calculator Functionality**:
   - Enter $75,000 in both Federal and Maryland gross income fields
   - Verify calculations: Federal tax ~$8,523, State ~$3,510, County ~$2,025
   - Test both input methods: sliders and number inputs
   - Verify AGI and taxable income calculations update correctly
   - Type more than $1,000,000, or paste a negative number: the field is limited to $0 - $1,000,000 and a note says so
   - Enter deductions or credits larger than what is available: the equation boxes on the Federal/State Tax Math tabs show the amounts actually used, with a note

2. **User Interface Features**:
   - Toggle dark/light theme using button in top-right (the choice is remembered; until a choice is made the theme follows the operating system)
   - Navigate between all 4 tabs: Calculator, Federal Tax Math, state Tax Math (named after the selected state), Tax Bracket Breakdown; with the keyboard, Tab reaches the selected tab and the arrow keys, Home and End move between tabs
   - Toggle State between Maryland and Virginia: every "Maryland"/"Virginia" and county label, the tab name, the page title and the bracket tables should follow the selection
   - Open the County dropdown: Maryland lists 24 entries with their rates (Anne Arundel and Frederick are graduated); Virginia lists 95 counties and 38 independent cities, all "no local income tax"
   - Switching state and back keeps each state's last-picked county
   - Verify responsive design by resizing browser window
   - Test slider/input synchronization

3. **Modular Architecture**:
   - Visit `/example.html` and test all 4 module examples
   - Verify "Run Tax Calculation" produces correct results
   - Test currency formatting examples display properly

### Expected Results:
These assume the deduction, adjustment and credit fields are left at their default of 0.
- **Main calculator** at $75k income (married filing status): 
  - Federal tax: $8,523 (11.36% effective rate)
  - Maryland state tax: $3,510 (4.68% rate)
  - Anne Arundel County tax: $2,025 (2.70% rate)
  - Total effective rate: 18.74%, take-home pay: $60,942
  - Baseline Comparison panels (standard deduction only): federal $4,743 (deduction $31,500); Maryland $3,192 state + $1,844 county = $5,036 (Maryland's deduction is $6,700)
- **Virginia** at $75k income (married filing status, State toggle on Virginia, any county):
  - Federal tax: $8,523 (11.36% effective rate)
  - Virginia state tax: $4,055 (county tax: $0 - Virginia localities do not tax income)
  - Total effective rate: 16.77%, take-home pay: $62,422
  - Baseline Comparison (Virginia's deduction is $17,500): $3,049 state tax
- **Federal tab** shows step-by-step calculation breakdown with baseline comparison
- **State tab** (Maryland or Virginia) shows separate state and county tax calculations with baseline
- **Dark mode** changes background colors and preserves all functionality
- **Example page** modules work independently (TaxCalculator, DisplayManager, etc.)

### Browser Compatibility:
- Requires a modern browser with ES module support and `Object.hasOwn` (Chrome 93+, Firefox 92+, Safari 15.4+); the responsive layout also uses CSS container queries (Chrome 105+, Firefox 110+, Safari 16+), and browsers without them show the stacked phone layout at every width
- Tested in current Chrome and Firefox
- **NO INTERNET REQUIRED** except for Google Fonts (graceful fallback to system fonts)
- **NO CONSOLE ERRORS** during normal operation

## Common Tasks

### Making Changes:
- **CSS styling**: Edit `styles.css` directly (mobile-first approach)
- **Tax calculation logic**: Modify `js/taxCalculator.js` (federal brackets and the calculation methods); state and county brackets live in `js/jurisdictionData.js`
- **UI components**: Update `js/uiControls.js` or `js/displayManager.js`
- **New features**: Follow modular pattern - create new module and import in `main.js`

### Tax Bracket Updates:
- Federal brackets: `this.federalBrackets` in `taxCalculator.js`
- Federal standard deductions: `this.standardDeductions` in `taxCalculator.js`
- State brackets and state standard deductions: each state's entry in `STATES` in `jurisdictionData.js`
- County brackets: each state's `counties` list in `jurisdictionData.js` (Maryland entries use `flat(rate)` or explicit brackets; `{ wholeIncome: true }` marks counties whose graduated rates are not marginal, i.e. the rate of the bracket your whole taxable income falls in applies to all of it - Frederick County, MD)
- **Tax year**: everything is tax year 2025 (`TAX_YEAR` in `jurisdictionData.js`, shown in the page header; the sources are listed in that file's header). When refreshing a year, update the federal brackets and deductions, the state brackets, the standard deductions and every county rate together, then `TAX_YEAR` and the sources, and re-check that Frederick County's `wholeIncome` method still holds (the Comptroller may change how it collects graduated county rates). Update the expected results above.

### Adding a New State:
1. Add an entry to `STATES` in `jurisdictionData.js` with every key the MD and VA entries have: `code` (same as its `STATES` key), `name`, `brackets` (`{ single, married }`), `standardDeduction` (`{ single, married }`, flat amounts), `countyLabel` (the dropdown's label), `counties`, `defaultCounty` (the county's slug code such as `'fairfax-county'`, not its display name) and `countyNote` (`null`, or the sentence shown under the dropdown when its counties levy no income tax)
2. Add a radio button for it to the State toggle (`name="stateSelect"`) in `index.html`; its `value` must equal the state `code`
3. For a state that fits the same model (filing-status brackets, a flat standard deduction, one local layer taxed on state taxable income), nothing else is needed: `TaxCalculator`, the County dropdown, the labels and the bracket tables all read from `jurisdictionData.js`
4. Re-run the scenarios in the Validation section for the new state

The state and county element ids and classes (`state-visual-*`, `state-baseline-*`, `state-bracket-table`, `county-bracket-table`, `calc-state-*`, `calc-county-*`) are generic: they belong to whichever state and county are selected, and the visible names come from the `data-state-name` / `data-county-name` spans. Reuse them; do not add per-state copies.

## Architecture Notes

### Modular Design:
- **TaxCalculator**: Pure calculation logic, no DOM interaction. Every amount is a whole dollar (inputs are rounded, each tax is rounded once) so the displayed parts add up to the displayed totals
- **jurisdictionData**: State and county tax data only (no DOM, no calculation)
- **UIControls**: Input handling and form state management (including the State toggle and County dropdown); keeps amounts between each field's `min` and `max`
- **DisplayManager**: All DOM updates and visual formatting
- **ThemeManager**: Dark/light mode: the saved choice, otherwise the operating system's setting; storage is best effort
- **TabManager**: Navigation between calculator views (WAI-ARIA tabs)
- **Main**: Coordinates all modules and manages application state

The modules are not independent of `index.html`: `UIControls` and `DisplayManager` look up elements by id, and `main.js` calls specific methods on each module (see the table in `README.md`).

### No Build Process Benefits:
- **Zero setup time** for new developers
- **Immediate feedback** - just refresh browser
- **No dependency management** or version conflicts
- **Easy deployment** to any static hosting
- **Simple debugging** with browser DevTools

### Key Components:
- **ES6 modules** with import/export
- **Progressive tax bracket calculations** for federal, state and county
- **Real-time updates** as user types or moves sliders
- **Mobile-responsive design** without CSS frameworks
- **Local storage** for the theme choice only

## Troubleshooting

### Common Issues:
- **Fonts not loading**: Check internet connection (Google Fonts) - app works without them
- **Module import errors**: Ensure serving over HTTP, not file:// protocol (the page shows a red banner when the calculator did not start)
- **Calculations incorrect**: Verify tax bracket arrays are properly formatted
- **UI not updating**: Check console for JavaScript errors in modules; a renamed or mistyped element id is reported at startup ("could not find these page elements", once per module)

### Debug Commands:
```bash
# Serve application
python3 -m http.server 8000

# Check file permissions
ls -la /path/to/repository

# Validate HTML/CSS (if tools available)
# No specific linting tools included in this project
```

This is a **purely frontend application** with no backend, no database, no API dependencies, and no build pipeline required.