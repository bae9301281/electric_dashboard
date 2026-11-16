---
name: PowerGrid SMP Explorer
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5a4138'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#8e7166'
  outline-variant: '#e2bfb2'
  surface-tint: '#a73a00'
  primary: '#a33900'
  on-primary: '#ffffff'
  primary-container: '#cc4900'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb599'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb599'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#7f2b00'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 2.5rem
    fontWeight: '700'
    lineHeight: 3rem
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 1.875rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  metric-num:
    fontFamily: JetBrains Mono
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.03em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is tailored for beginners navigating the complexities of wholesale electricity markets—specifically the System Marginal Price (SMP). The brand personality balances institutional authority with educational clarity, ensuring data-dense information feels accessible rather than intimidating.

- **Target Audience:** Independent power producers (solar, wind), energy sector newcomers, financial analysts, and corporate sustainability officers monitoring real-time power settlement prices.
- **Emotional Response:** Confidence, lucidity, and rapid comprehension. The interface avoids dense trading-terminal clutter in favor of scannable, calm, yet active data presentation.
- **Design Style:** Modern Clean Functionalism with High-Clarity Metric Cards. A crisp, light-mode-first environment built on cool slate neutrals, elevated by luminous energy-inspired dynamic amber/orange accents. It employs structured layout grids, subtle hairline borders, and balanced whitespace to transform abstract market volatility into digestible operational insights.

## Colors

The color palette centers on active energy metrics while prioritizing legibility and cognitive load reduction across daylight operational hours.

- **Primary (`#EA580C` / `#F97316`):** The electric flame palette. Used for peak SMP values, primary call-to-actions, active real-time indicators, and critical market spikes. Tint variations (`#FFEDD5`) provide soft highlight fills for background tags, current-hour badges, and card active states.
- **Secondary (`#0284C7`):** Represents grid base-load, conventional generation markers, and comparative historical lines in multi-metric time-series charts.
- **Tertiary (`#10B981`):** Applied to eco-generation metrics (renewables share), negative spreads, or stable downward price drifts.
- **Neutrals & Surfaces:**
  - **Canvas Base:** `#F8FAFC` (Slate-50) gives subtle warmth that prevents eye fatigue compared to pure white.
  - **Surface Container (Cards & Panels):** `#FFFFFF` delivers contrast and structural clarity.
  - **Dividers & Outlines:** `#E2E8F0` (Slate-200) for structural bounding; `#CBD5E1` (Slate-300) for interactive borders.
  - **Typography Slate:** Primary headers in `#0F172A` (Slate-900), secondary values and body text in `#334155` (Slate-700), supporting labels and unit markers in `#64748B` (Slate-500).

## Typography

The type system blends technical precision with modern legibility:

- **Space Grotesk (Headings & Aggregations):** Introduces a modern, engineering-oriented voice for dashboard headers, module titles, and market status announcements.
- **Plus Jakarta Sans (Body & Explanatory Prose):** High x-height and friendly apertures that demystify technical electricity market definitions for novice users.
- **JetBrains Mono (Price Figures, Units, Timestamps):** Guarantees strict tabular alignment for continuous hourly columns (e.g., `01:00 ~ 24:00`), currency notations (`KRW/kWh`), and dynamic percentage shifts without visual jitter.

## Layout & Spacing

The dashboard employs a fluid, multi-tier layout structured to facilitate logical market discovery from macro overview down to 24-hour drill-downs.

- **Grid Model:**
  - **Desktop (>=1200px):** 12-column layout with 24px (`1.5rem`) gutters and a max canvas constraint of 1440px. The top metric strip occupies a uniform 3- or 4-column span; the central hourly chart commands an 8-column primary zone flanked by a 4-column regional spread card (Land vs. Jeju).
  - **Tablet (768px - 1199px):** 8-column layout with 20px (`1.25rem`) gutters. Metric summary cards wrap into a 2x2 matrix, and charts stack vertically above granular tables.
  - **Mobile (<768px):** Single-column layout with 16px (`1rem`) side margins. Horizontal swiping cards with scroll indicators are used for the 24-hour tabular breakdown to preserve vertical space.
- **Spacing Rhythm:** Internal card spacing strictly leverages `space-md` (16px) for compact metric tiles and `space-lg` (24px) for master visualization charts.

## Elevation & Depth

Visual hierarchy is maintained through crisp surface separation rather than heavy skeuomorphic shadows, reinforcing a clean analytical aesthetic.

- **Level 0 (Canvas):** Flat `#F8FAFC`. Background layer hosting systemic status bars and structural page dividers.
- **Level 1 (Card Surfaces):** `#FFFFFF` paired with a single-pixel structural hairline (`border: 1px solid #E2E8F0`) and an ambient, low-opacity shadow (`box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`).
- **Level 2 (Interactive Hover / Current-Hour Active State):** Active hourly data points and hovered metric widgets elevate subtly (`box-shadow: 0 4px 12px -2px rgba(234, 88, 12, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`), paired with a prominent primary accent border (`#F97316`).
- **Level 3 (Tooltips & Popovers):** Chart tooltips and glossary helpers use floating `#0F172A` deep slate containers with crisp high-contrast white text (`box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1)`).

## Shapes

The design uses a refined curvature profile (`roundedness: 2`) that softens technical density without appearing juvenile.

- Standard cards, dashboard panels, and data table containers feature `12px` (`0.75rem`) to `16px` (`rounded-lg`, `1rem`) corner radii.
- Interactive chips, hourly timeline segment bars, and market status tags utilize `8px` (`rounded`, `0.5rem`).
- Real-time indicator pills (e.g., `● LIVE SMP`) and metric unit badges utilize full capsule shapes (`9999px`) to immediately communicate status metadata.

## Components

### 1. KPI Metric Summary Cards
- Surface: `#FFFFFF` with `#E2E8F0` border.
- Layout: Sub-label at the top (`label-sm` in `#64748B`), massive current price display using `metric-num` (`Space Grotesk` or `JetBrains Mono` in `#0F172A`), accompanied by trend indicator badges (e.g., `+12.4% vs Yesterday` inside a `#FFEDD5` pill with `#EA580C` text).
- Includes mini inline trend sparklines (32px height) running across the base of the card.

### 2. Hourly SMP Interactive Chart Card
- Primary line / bar rendered in `#EA580C` with a soft gradient area fill (`linear-gradient(180deg, rgba(234,88,12,0.18) 0%, rgba(234,88,12,0.0) 100%)`).
- Horizontal baseline gridlines rendered in discrete `#F1F5F9`.
- Current operational hour marked with a highlighted vertical reference track and an amber pulsing dot indicator.

### 3. Filter Chips & Segmented Controls
- Default: `#F1F5F9` background, `#475569` text, zero border.
- Active: `#FFEDD5` background, `#EA580C` text, and a crisp 1.5px outline in `#F97316`. Used for region selection (`통합`, `육지`, `제주`) and resolution ranges (`1시간`, `24시간`, `주간 평균`).

### 4. Market Glossary Tooltip Helpers
- Dotted underline text (`border-bottom: 1px dashed #94A3B8`) alongside an info icon (`ⓘ`).
- Hover reveals a floating popover defining foundational terms (e.g., "계통한계가격(SMP)이란?") in simple language with `body-sm` typography.

### 5. Hourly Price Table
- Clean alternating rows or crisp borders between hours (`#F1F5F9`).
- Peak pricing cells (top 15% hourly rates) automatically receive a soft `#FFF7ED` warm cell background to assist quick scanning.
- Numerical values aligned strictly to the right using `JetBrains Mono`.

### 6. Buttons & Quick Actions
- Primary Button: Solid `#EA580C` with `#FFFFFF` text, subtle amber hover glow (`hover:bg-[#C2410C]`), rounded to 8px.
- Secondary Button: `#FFFFFF` fill, `#CBD5E1` border, `#334155` text (`hover:bg-[#F8FAFC]`).