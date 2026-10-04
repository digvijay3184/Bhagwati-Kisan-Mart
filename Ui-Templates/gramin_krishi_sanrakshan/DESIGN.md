---
name: Gramin Krishi Sanrakshan
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#404940'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707a6f'
  outline-variant: '#bfc9bd'
  surface-tint: '#1f6c39'
  primary: '#005224'
  on-primary: '#ffffff'
  primary-container: '#1e6b38'
  on-primary-container: '#9ce9a9'
  inverse-primary: '#8bd899'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#003da6'
  on-tertiary: '#ffffff'
  tertiary-container: '#0052d9'
  on-tertiary-container: '#cbd6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f4b3'
  primary-fixed-dim: '#8bd899'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005225'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Noto Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  price-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system is engineered for rural and semi-urban agricultural commerce in northern India, serving farmers, progressive growers, and village-level agri-dealers. The interface prioritizes institutional legitimacy, transparent pricing, and functional utility over aesthetic extravagance.

### Brand Personality & Emotional Core
- **Reliable Authority:** Resembles an established, government-licensed cooperative retail depot—grounded, reliable, and unpretentious.
- **Dignified Utility:** Eliminates deceptive visual noise and flashy micro-animations in favor of large touch points, unmistakable transactional indicators, and legible technical specifications.
- **Tactile Familiarity:** Employs physical retail metaphors (clear product tags, stamped GST seals, tangible bag and bottle imagery) to eliminate skepticism around digital financial transactions and product authenticity.

### Design Movement: Functional Agricultural Realism
A hybrid of **Tactile / Utility-First Commerce** and **High-Contrast Informational Architecture**:
- Substantial component densities with minimal 48px baseline tap zones to accommodate outdoor thumb use under direct sunlight.
- Distinct color-coded agricultural regulatory cues (Central Insecticides Board & Registration Committee color standards for toxicity ratings, alongside crop-stage classification tags).
- Dual visual modes: a warm, accessible storefront for farmers, alongside an administrative operations interface characterized by dense, tabular data entry, monochrome gridlines, and rapid keyboard navigation.

## Colors

The palette draws directly from lush crop canopies, ripening wheat fields, and government regulatory stamp marks, built to perform under high ambient sunlight on low-cost IPS displays.

### Role Assignments
- **Primary (`#1E6B38`)**: Represents vitality, seed viability, and genuine agrochemical distribution. Applied to core primary buttons, checkout conversion points, verified store badges, and header navigation banners.
- **Secondary (`#D97706`)**: Harvest amber. Denotes special subsidies, limited-time sowing season discounts, star ratings, loyalty reward points, and call-out ribbons.
- **Tertiary (`#2563EB`)**: Technical/Admin slate blue. Reserved for logistical tracking, batch/lot serial identifiers, GST invoice links, technical chemical data sheets, and ERP admin tables.
- **Neutral (`#0F172A`)**: Slate deep-charcoal. Provides ink-like contrast for product titling, net weights, active ingredients, and Hindi glyph rendering.

### Background & Surface Hierarchy
- **Canvas Base (`#F8FAF6`)**: Warm, pale-tinted green-gray surface that reduces outdoor glare without the harshness of pure `#FFFFFF`.
- **Card Surface (`#FFFFFF`)**: Pure white reserved for actionable cards, product containers, and floating modals to ensure distinct visual boundaries.
- **Structural Outlines (`#E2E8F0`)**: Low-saturation slate borders ensuring discrete panel division without relying solely on subtle shadows.

### Regulatory & Functional Feedback
- **Toxicity & Safety Badges**: Red (`#DC2626` - Extremely Toxic / Schedule Caution), Bright Yellow (`#EAB308` - Highly Toxic), Vivid Blue (`#2563EB` - Moderately Toxic), and Forest Green (`#15803D` - Slightly Toxic / Bio-stimulant).
- **Transaction Feedback**: Success (`#15803D`), Warning (`#B45309`), Destructive/Out-of-Stock (`#DC2626`).

## Typography

Typography balances multi-script legibility (Latin and Devanagari) with absolute operational clarity for product names, measurements, dosages, and prices.

### Font System & Script Cohesion
- **Display & Headings (Plus Jakarta Sans)**: Open apertures, robust counters, and geometric structure prevent character degradation on lower-density screens.
- **Body & Script Fallback (Noto Sans / Noto Sans Devanagari)**: High x-height, neutral letterforms, and full conjunct vowel support. Hindi strings maintain identical line heights and baselines as English equivalents without text clipping.
- **Numeric & Technical Codes (JetBrains Mono)**: Used strictly for SKU codes, GSTIN numbers, batch identifiers, expiry dates, and dosage tabular numbers to prevent numerical reading errors.

### Implementation Rules
- **Price Display**: Never render currency symbols smaller than numerical data. The rupee sign (₹) matches the numeric weight. MRP strikethroughs must use a diagonal or 40% opacity mid-line with neutral gray (`#64748B`) to distinguish clearly from active selling prices.
- **Agrochemical Technical Names**: Scientific chemical compositions (e.g., *Chlorpyrifos 50% + Cypermethrin 5% EC*) must be rendered in `body-sm` using font weight 500 under commercial brand names to facilitate regulatory compliance.

## Layout & Spacing

The layout accommodates varied hardware—from budget Android mobile devices running sub-HD resolutions to dual-monitor counter-top billing terminals.

### Breakpoints & Grid Composition
- **Mobile (`< 640px`)**: 4-column fluid layout, `1rem` outer margins, `1rem` column gutters. Primary actions dock to the lower screen edge as fixed bottom sheets to enable single-handed field operation.
- **Tablet (`640px – 1024px`)**: 8-column layout, `1.5rem` gutters, `2rem` margins. Side-by-side comparison matrices for fertilizers and seeds become interactive split views.
- **Desktop / Store POS (`> 1024px`)**: 12-column fixed grid capped at 1280px max-width, `2rem` gutters, `3rem` margins. In administrative mode, the container expands to 100% fluid edge-to-edge with locked left navigation.

### Vertical Cadence & Spatial Rhythm
All margins and paddings map strictly to an 8px baseline rhythm (multiples of `0.5rem`), with a micro-step of 4px (`0.25rem`) used exclusively for tag padding and inline badge icons. Vertical gaps between catalog cards prioritize consistent card heights to align buy buttons along uniform horizontal baselines.

## Elevation & Depth

Visual hierarchy uses physical material cues rather than exaggerated digital dropshadows, ensuring accessibility in high glare and across screens with limited dynamic range.

### Tonal Stratification
- **Ground (Level 0)**: Page backdrop (`#F8FAF6`). Completely matte, unshaded.
- **Surface (Level 1)**: Primary product cards, order rows, information accordions (`#FFFFFF`). Defined by a structural 1px solid border (`#E2E8F0`) paired with a tight ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Raised (Level 2)**: Hover states, active batch selector chips, cart review summaries. Defined by a 1px border (`#CBD5E1`) and directional shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Floating (Level 3)**: Sticky bottom quick-order bars, voice-search modals, pesticide dosage calculators. Lifted using `0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)` with an assertive border (`#CBD5E1`).

### Administrative Mode Depth
The POS and Admin views abandon soft shadows entirely, transitioning to high-contrast monochrome panel borders (`1px solid #CBD5E1`) and stark background alternations (`#FFFFFF` alternating with `#F1F5F9`) to maximize legibility and data density during rapid barcode scanning and order creation.

## Shapes

The design system employs a soft, grounded geometry (`roundedness: 1`), providing an institutional, trustworthy feel that avoids both overly playful bubble-like aesthetics and severe industrial edges.

### Radius Values
- **Base Surfaces & Inputs (`0.25rem` / 4px)**: Checkboxes, table cells, form inputs, SKU pill borders, and administrative action buttons.
- **Cards & Structural Containers (`rounded-lg: 0.5rem` / 8px)**: Product listing cards, dosage guides, banner containers, dialog boxes.
- **Promotional & Status Badges (`rounded-xl: 0.75rem` / 12px)**: Category tags, GST certification stamps, toxicity warning bands.
- **Pill Exceptions**: Category selection chips and floating WhatsApp order buttons maintain circular ends (`rounded-full` / 9999px) to indicate continuous tap accessibility.

## Components

### Buttons & Interactive Controls
- **Primary CTA**: Deep earthy green background (`#1E6B38`), pure white label (`#FFFFFF`), solid construction with minimum height of 48px on mobile for confident thumb tapping. Active state features a 2px downward inset visual depression.
- **Secondary CTA**: Clear white background (`#FFFFFF`), 1.5px solid border (`#1E6B38`), text colored `#1E6B38`. Used for "Add to Cart" while Primary handles "Buy Now / अभी खरीदें".
- **Admin POS Actions**: High-density buttons with 36px height, using `#334155` (slate) for utility options and `#2563EB` for transaction commits.

### Category & Formulation Pill Tags
- Standardized taxonomy tags for agricultural inputs:
  - **Insecticide**: Soft amber background (`#FEF3C7`), text `#92400E`.
  - **Fungicide**: Soft violet background (`#EDE9FE`), text `#5B21B6`.
  - **Herbicide**: Soft emerald background (`#D1FAE5`), text `#065F46`.
  - **PGR / Bio-stimulant**: Soft sky background (`#E0F2FE`), text `#075985`.
  - **Fertilizer**: Warm sand background (`#FEE2E2`), text `#991B1B`.
- Tags feature a distinct 1px border matching 20% opacity of their text color.

### Form Inputs & Selectors
- **Fields**: 48px standard touch target. Crisp 1.5px border (`#CBD5E1`), background `#FFFFFF`. Active focus state triggers a 2px focus ring in `#1E6B38` with an offset of 1px.
- **Bilingual Labels**: English field label (`14px`, weight 600) stacked immediately with secondary Hindi assistance label (`12px`, weight 400, `#64748B`).
- **Pack Size Selector**: Segmented radio cards (e.g., 250ml, 500ml, 1L / 5kg, 25kg, 50kg bags) showing live stock status and per-unit price break-ups.

### Cards & Commercial Displays
- **Product Listing Card**: Pure white background, `0.5rem` radius, 1px border (`#E2E8F0`). Contains:
  1. Top-left category tag and top-right official brand logo.
  2. High-clarity pack photo on clean `#FFFFFF` frame.
  3. Commercial name in `headline-md`, active chemical formulation in `body-sm`.
  4. Pricing block: Large bold discounted price (`price-hero`), struck-through MRP, and a badge highlighting total rupee savings (e.g., "बचत ₹140").
  5. Mandatory GST-compliant badge: "GST Paid / पक्का बिल" in `code-md` font with a small lock/shield icon.

### Administrative & Dealer Mode
- **Table Density**: 32px row heights, fixed headers, zebra-striped rows (`#F8FAFC` on alternating rows).
- **Batch & Expiry Highlight**: Expiries within 90 days flash an amber warning dot; expired inventory is auto-highlighted in soft red with locked billing controls.