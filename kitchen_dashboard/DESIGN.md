# Design System Specification: Editorial Precision

This document defines a high-end, editorial-inspired visual language that moves beyond standard UI patterns. It focuses on the "HIKARINAMI" identity through intentional asymmetry, tonal layering, and a "Red-as-Signal" color philosophy. 

---

### 1. Overview & Creative North Star: "The Modern Curator"

The Creative North Star for this system is **"The Modern Curator."** Unlike generic food service apps that rely on heavy borders and cluttered grids, this system treats every screen as a high-end editorial spread. We break the "template" look by using extreme white space, high-contrast typography scales, and a complete rejection of traditional structural lines.

The goal is to make the user feel they are browsing a bespoke digital lookbook where the food is the art, and the UI is the gallery wall.

---

### 2. Colors & Tonal Hierarchy

We utilize a restrained palette where color is never decorative—it is functional.

#### The Color Map
- **Primary Signal:** `#af101a` (Primary) / `#d32f2f` (Primary Container). Reserved strictly for high-priority CTAs, price points, and active navigational states.
- **Surface & Background:** `#f9f9f9`. This neutral, off-white base provides a soft, premium canvas that reduces eye strain compared to pure white.
- **Secondary/Neutral:** Transitions between `#5f5e5e` and `#1a1c1c` for secondary text and structural prominence.

#### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Boundaries must be defined through:
1.  **Background Shifts:** Transitioning from `surface` to `surface-container-low` to define a section.
2.  **Negative Space:** Using the spacing scale to create mental groupings rather than physical ones.

#### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of fine paper. 
- Use `surface-container-lowest` (#ffffff) for floating cards.
- Use `surface-container-high` (#e8e8e8) for recessed areas like search bars or toggle tracks.
- This creates "nested" depth without the need for dated bevels or shadows.

---

### 3. Typography: The Editorial Voice

We use **Plus Jakarta Sans** for its geometric clarity and modern humanist feel.

| Level | Token | Size | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display (H1)** | `headline-lg` | 2.0rem | -0.02em | Page Titles (e.g., "Your Order") |
| **Headline (H2)** | `title-lg` | 1.375rem | -0.01em | Section Titles (e.g., "Ramen") |
| **Body (Main)** | `body-md` | 0.875rem | Normal | Descriptions & item details |
| **Micro (Label)** | `label-sm` | 0.6875rem | +0.05em | Labels (e.g., "SPICE LEVEL"), Uppercase |

**The Branding Constraint:** The header must always be the text **HIKARINAMI** in `title-md`, solid black (#1a1c1c), centered or left-aligned with zero iconography.

---

### 4. Elevation & Depth

Hierarchy is achieved through **Tonal Layering** and **Ambient Light**, not structural scaffolding.

- **The Layering Principle:** Depth is "stacked." A `surface-container-lowest` card sitting on a `surface` background creates a natural, soft lift.
- **Ambient Shadows:** For floating elements (like a "Add to Cart" bar), use a shadow with a blur of 24px, 0px offset, and 4% opacity using a tint of the `on-surface` color.
- **Glassmorphism:** For the header or floating navigation, use `surface` at 80% opacity with a `backdrop-filter: blur(10px)`. This allows the vibrant food imagery to bleed through the UI, softening the experience.
- **The Ghost Border:** If accessibility requires a stroke, use `outline-variant` (#e4beba) at 20% opacity. Never use 100% opaque borders.

---

### 5. Components

#### Buttons (Primary)
- **Background:** `#d32f2f` (Primary Container)
- **Text:** `#ffffff` (On Primary), Semi-bold.
- **Radius:** `0.25rem` (DEFAULT) for a sharp, architectural look.
- **Padding:** 12px vertical / 24px horizontal.

#### Price Points
- **Color:** `#d32f2f` (Primary Container)
- **Typography:** `title-md`.
- **Alignment:** Must be vertically aligned in list views to create a "price column" for easy scanning.

#### Selection Pills (Spice Level/Add-ons)
- **Unselected:** `surface-container-high` background, `on-surface-variant` text.
- **Selected:** `#d32f2f` background, `white` text.
- **Radius:** `full` (9999px) to contrast against architectural square buttons.

#### Cards & Lists
- **Rule:** Forbid divider lines. Use `1.5rem` (24px) of vertical white space to separate items. 
- **Tax Calculation:** Always display "HST (13%)" in `label-sm` color `secondary`.

---

### 6. Do’s and Don’ts

#### Do
- **Do** use vertical price alignment to create a sense of order.
- **Do** allow imagery to take up significant real estate; the UI is the frame, the food is the art.
- **Do** use uppercase for `Micro` labels to create a sophisticated, "label-maker" aesthetic.
- **Do** use 13% for all HST calculations.

#### Don't
- **Don't** use icons in the header. The text "HIKARINAMI" must stand alone.
- **Don't** use standard 1px grey dividers to separate menu items. Use space or tonal shifts.
- **Don't** use red for anything other than "Action" (Buttons), "Value" (Price), or "Active" (Selection).
- **Don't** use "Drop Shadows" that look like shadows; aim for "Ambient Glows."