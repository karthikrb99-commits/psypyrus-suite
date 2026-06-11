# Document 04 — UI/UX Design Brief (Visual & Interaction Design Guide)

This document provides visual guidelines, design tokens, responsive breakpoints, and styling specifications to ensure absolute aesthetic consistency across all platforms in the **PsyPyrus Suite**.

---

## 1. Unified Theme Framework & Tokens

### 1.1 Root CSS Variables & Jetpack Compose/SwiftUI Themes
All client layouts bind to a single design system using the following color palette:

| Design Token | Color Name | Hex Value | Application Context |
| :--- | :--- | :--- | :--- |
| `--bg-main` | Dark Onyx | `#0D0D0D` | Base canvas background for all screens. |
| `--bg-card` | Elevated Onyx | `#121214` | Dialog frames, card panels, and sliders. |
| `--primary` | Deep Indigo | `#6C47FF` | Clinician navigation, CTA controls, focus glows. |
| `--secondary` | Muted Violet | `#4C2FBA` | Subheadings, toggle borders, badge chips. |
| `--accent-teal` | Vibrant Teal | `#00F2FE` | Achievement badges, edit tools, comorbidity lines. |
| `--accent-pink` | Cyber Pink | `#FF007F` | MindCoins, daily quests, level progression indicators. |
| `--text-primary` | Cool Off-White| `#F5F5F7` | Body copy, heading text, input fields. |
| `--text-muted` | Muted Slate | `#9E9EAF` | Descriptions, placeholder texts, empty states. |

---

## 2. Interactive Theme Transformations

Patients can spend earned MindCoins in the **MindShop** to unlock global styling overlays that modify CSS properties (Web) or active styling states (Android Compose / iOS SwiftUI):

```
                        +----------------------------+
                        |     Theme Selection        |
                        +--------------+-------------+
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
        v                              v                              v
+------------------+           +------------------+           +------------------+
|    Onyx Dark     |           |   Retro CRT      |           |  Glassmorphism   |
|  (Base Premium)  |           |  (Green phosphor,|           |  (Backdrop blur, |
|                  |           |   scanlines,     |           |   translucent,   |
|                  |           |   mono font)     |           |   deep gradients)|
+------------------+           +------------------+           +------------------+
```

### 2.1 Default Theme: Onyx Dark
*   **Aesthetic**: Highly polished card modules, transparent borders, thin divider lines, and glowing active states.
*   **Shadows**: `0 4px 30px rgba(0, 0, 0, 0.5)` with subtle primary glows on active inputs.

### 2.2 Unlocked Theme: Retro CRT
*   **Aesthetic**: Monochromatic green phosphor text shadows, terminal-inspired scanline overlays (`linear-gradient`), CRT phosphor screen curvature wraps, and monospace typography (`Geist Mono`).
*   **Color Profile**: Background: `#001100`, Primary Text: `#33FF33`.

### 2.3 Unlocked Theme: Glassmorphic Translucent
*   **Aesthetic**: Translucent card panels with heavy backdrop blurs, pastel background gradients, and thin borders.
*   **Tokens**: Card Background: `rgba(18, 18, 20, 0.45)`, Backdrop Blur: `16px`, Border Color: `rgba(255, 255, 255, 0.08)`.

---

## 3. Typography Specifications

*   **System UI & Interface Copy**: **Inter** (sans-serif) or Apple's system font, ensuring readability in small sizes.
*   **Headers & Section Titles**: **Outfit** or **Geist** to deliver a sleek visual imprint.
*   **Technical Metrics & Codes**: **Geist Mono** or **JetBrains Mono** (used in HIPAA audit logs, command palettes, and ICD code blocks).

---

## 4. UI Layout Panels & Grids

### 4.1 Grid Breakpoints
*   **Desktop & Web Canvas**: 12-column grid. Collapsible navigation sidebar width is fixed at `260px` with workspace width expanding dynamically.
*   **Tablet**: 6-column grid. Left sidebar collapses into an overlay drawer.
*   **Mobile Screen (Android / iOS)**: Single-column layouts with vertical scroll containers. Bottom Tab navigation replaces sidebars.

### 4.2 Interactive Elements & Spacing
*   **Touch Targets**: All buttons, chips, and checklists maintain a minimum size of `44dp` / `44px` to prevent mis-taps.
*   **Padding Scale**: 4dp (micro), 8dp (small), 16dp (standard/margins), 24dp (modal borders).
*   **Border Radius**: Cards & Modals: `12px` rounded edges. Buttons: `8px`.
*   **Micro-Animations**: All button states and chip selections feature smooth transitions (`transition: all 0.2s ease`).
