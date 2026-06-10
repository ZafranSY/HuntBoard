# CiptaCraft Design System & Style Guide

This document acts as the single source of truth for the **CiptaCraft** design language. All pages, sections, and interactive components must adhere to this system to guarantee a consistent visual identity, maintain Core Web Vitals performance, and avoid layout shifts (CLS).

---

## 1. Design Philosophy

CiptaCraft features a **Light Industrial Asymmetric Blueprint** aesthetic. 
* **Engineered Precision**: Layouts should resemble technical blue prints, structural schematics, and clean grids.
* **Aesthetics of Restraint**: Decorative clutter, heavy third-party client-side animations, and generic pre-styled packages are rejected in favor of raw performance, mathematical precision, and rapid interaction.
* **Performance-First**: Layout components must use lightweight, native CSS containment boundaries instead of heavy rendering frameworks.

---

## 2. Color System

We do not use generic colors (e.g., standard blue, green, or default red). The application uses a strictly defined neutral, warm industrial color palette.

| Token | CSS Variable / Hex | Usage Description |
| :--- | :--- | :--- |
| **Theme Background** | `var(--themed-background)` / `#EAE8E4` | Main warm bone/cream background color for all pages and components. |
| **Theme Foreground** | `var(--themed-foreground)` / `#2D2D2D` | Charcoal/carbon off-black color for text, headers, primary buttons, and borders. |
| **Blueprint Grid Lines** | `rgba(45, 45, 45, 0.05)` to `0.15` | Used for drawing the thin, clean industrial alignment borders and separator lines. |
| **Matrix Dot Mesh** | `rgba(45, 45, 45, 0.08)` | Used in background grids and structural media quadrants. |
| **Text Muted / Accent** | `rgba(45, 45, 45, 0.5)` to `0.7` | Reduced opacity charcoal for metadata, monospace status lines, and body descriptions. |

---

## 3. Typography & Spacing

### Font Families
1. **Primary & Heading Font**: `var(--font-jakarta)` (Plus Jakarta Sans) falling back to `'Inter', sans-serif`. Used for main content, section headers, and descriptive text.
2. **Metadata & Code Font**: `'Monospace', monospace`. Used for system prefixes, indicators, coordinates, status readings, and tags.

### Typographic Scales & Heading Styles
Headings are typically **uppercase**, have a bold weight (600 to 800), and use negative letter spacing.

* **Main Page Titles (H1)**
  ```css
  font-size: clamp(2.25rem, 8vw, 7.5rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-transform: uppercase;
  color: #2D2D2D;
  ```
* **Section Titles (H2)**
  ```css
  font-size: clamp(2rem, 5vw, 4.5rem); /* or clamp(32px, 5vw, 48px) */
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  text-transform: uppercase;
  color: #2D2D2D;
  ```
* **Monospace Metadata / Accent Labels**
  ```css
  font-family: monospace;
  font-size: 10px; /* to 12px */
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: rgba(45, 45, 45, 0.6);
  ```

---

## 4. Components

### A. Buttons (`MonksButton`)
Do **not** use raw `<button>` elements or standard styling. Always import and use the custom interactive button component:

```tsx
import MonksButton from "@/components/MonksButton";
```

#### Supported Props:
* `label: string` (required)
* `href?: string` (optional - if provided, renders as `Link` or `a` anchor)
* `variant?: "primary" | "secondary" | "outline" | "primary-inverted"` (defaults to `"primary"`)
* `onClick?: () => void` (optional callback for standard action triggers)
* `className?: string` (custom sizing or layouts like `"w-full"`)

#### Variant Specifications:
1. **`primary`** (Dark Pill): `#2D2D2D` capsule with light text `#EAE8E4` and matching right-docked interlocking circle arrow badge.
2. **`primary-inverted`** (Light Pill): `#EAE8E4` capsule with dark text `#2D2D2D`, used specifically inside dark call-to-actions.
3. **`outline`** (Transparent Pill): Transparent background with 1px `#2D2D2D` border.

---

### B. Cards & Grid Structures
We enforce strict "chassis grid lists" where items are structured as list nodes inside a grid with single borders and responsive dimensions.

#### Card Grid Pattern:
```tsx
<ol style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '0px',
  borderTop: '1px solid rgba(45, 45, 45, 0.15)',
  borderLeft: '1px solid rgba(45, 45, 45, 0.15)',
  listStyle: 'none',
  padding: 0
}}>
  {items.map((item, index) => (
    <li
      key={item.id}
      style={{
        borderRight: '1px solid rgba(45, 45, 45, 0.15)',
        borderBottom: '1px solid rgba(45, 45, 45, 0.15)',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'background-color 0.3s ease',
        backgroundColor: 'transparent'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(45, 45, 45, 0.02)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div>
        {/* Monospace Indicator Tag */}
        <span style={{ display: 'block', marginBottom: '24px', fontSize: '12px', fontFamily: 'monospace', opacity: 0.5 }}>
          [0{index + 1} / {item.title}]
        </span>
        {/* Content */}
      </div>
      <MonksButton label="Action" href={item.href} variant="primary" />
    </li>
  ))}
</ol>
```

---

### C. Blueprint & Decorative Assets
To apply the light industrial style, components use visual grid markers, matrix dot nets, noise overlays, and position labels.

1. **CLS-safe Blueprint Grid Overlay**
   Draws horizontal/vertical alignment coordinates behind headers:
   ```tsx
   <div className="blueprint-grid-lines">
     <div className="blueprint-grid-cols">
       {[...Array(12)].map((_, i) => (
         <div key={i} className="blueprint-grid-col-line" />
       ))}
     </div>
     <div className="blueprint-grid-rows">
       {[...Array(6)].map((_, i) => (
         <div key={i} className="blueprint-grid-row-line" />
       ))}
     </div>
   </div>
   ```

2. **Corner Markers**
   Use small metadata coordinates absolute positioned inside parent blocks:
   ```tsx
   <div className="blueprint-label" style={{ position: "absolute", top: "12px", left: "12px" }}>[TL_04]</div>
   <div className="blueprint-label" style={{ position: "absolute", top: "12px", right: "12px" }}>[TR_04]</div>
   ```

3. **Matrix Dot Mesh Overlay**
   Used to break up solid backgrounds:
   ```tsx
   <div className="dot-matrix-mesh" />
   ```

---

## 5. Performance & Layout Rules (No CLS)

To prevent visual Cumulative Layout Shifts (CLS) and keep Lighthouse scores at 100/100, adhere to these guidelines:

1. **No Ad-Hoc Colors**: Never insert primary/accent colors outside `#EAE8E4`, `#2D2D2D`, and their explicit transparencies. (e.g. do **not** use `blue-600`, `indigo-500`, etc.)
2. **Explicit Dimensions on Media & Containers**: Media elements (video, images) must have strict coordinates and containment boxes:
   * Use `.media-quadrant` wrapper structures with explicit heights/aspect-ratios.
   * Provide a solid background fallback or loading state (e.g., CSS background-gradients for video components) to allocate container space before resources load.
3. **Hardware Compositor Layers**: Use `will-change: transform` and `contain: strict` on overlays (like blueprint grids or background textures) to guarantee they are isolated onto their own compositor thread.
4. **Snappy Animations**: Avoid long, heavy animation sequences. Keep transitions to native CSS variables or lightweight Framer Motion springs (`stiffness: 400, damping: 25`).
