```markdown
# Design System Specification: The Digital Nocturne

## 1. Overview & Creative North Star
**The Creative North Star: "The Neon Scriptorium"**

This design system is engineered to transform the solitary act of writing into an immersive, high-end digital experience. Moving away from the sterile, white-background "document" editors of the past, we embrace a "Neon Scriptorium" aesthetic—a dark, focused environment that blends the gravitas of a physical library with the cutting-edge energy of a neon-lit workspace. 

The system breaks the traditional "SaaS-in-a-box" look by utilizing intentional asymmetry, deep tonal layering, and "glowing" focal points. We prioritize focus through a "UI-as-Atmosphere" approach, where the interface recedes into the background, leaving the writer's words as the primary source of light and life.

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule
Standard UI relies on gray 1px borders to separate content. In this system, **solid 100% opaque lines are strictly prohibited for sectioning.** Boundaries are defined exclusively through:
- **Tonal Shifts:** Placing a `surface_container_high` card against a `surface` background.
- **Negative Space:** Using generous padding from our spacing scale to imply containment.
- **Luminous Transitions:** Using very subtle, low-opacity gradients (0% to 5% opacity) to suggest a change in section.

### Surface Hierarchy & Nesting
We treat the UI as a series of stacked, semi-transparent obsidian sheets.
- **Level 0 (Foundation):** `surface` (#0e0e11) — The infinite ink of the canvas.
- **Level 1 (Sections):** `surface_container_low` (#131316) — Sub-navigation or sidebar foundations.
- **Level 2 (Active Modules):** `surface_container_high` (#1f1f23) — The primary writing area or active data cards.
- **Level 3 (Interactive Floating):** `surface_bright` (#2c2c30) — Tooltips and hovering menus.

### The "Glass & Gradient" Rule
To achieve a "Cyber Purple" depth, use glassmorphism for any floating element (Modals, Popovers). 
- **Recipe:** Background `surface_container` at 70% opacity + `backdrop-blur: 24px`.
- **Accent:** Apply a 1px "Ghost Border" using `primary_dim` at 15% opacity to simulate light catching the edge of a glass pane.

---

### 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance technical precision with creative flair.

*   **The Display Voice (Manrope):** Chosen for its modern, geometric construction. Use `display` and `headline` scales for chapter titles and "Aha!" moments. The wide apertures reflect a tech-savvy, open-minded writer.
*   **The Functional Voice (Inter):** The workhorse for the writing experience. Inter’s high x-height ensures readability during 4,000-word sprints.

**Hierarchy Guidance:**
- **Display-LG (3.5rem):** Reserved for manuscript titles.
- **Title-MD (1.125rem):** The "Sweet Spot" for sidebar navigation and metadata.
- **Body-MD (0.875rem):** The standard for UI labels and secondary text.
- **Body-LG (1rem):** The "Writing Mode" default. Line height must be set to 1.7 for optimal prose digestion.

---

## 4. Elevation & Depth
Depth is not a drop shadow; it is a change in light.

*   **Tonal Layering:** Instead of "raising" an element with a shadow, "sink" the background. Place a `surface_container_lowest` (#000000) input field inside a `surface_container_high` card to create a recessed, tactile feel.
*   **Ambient Shadows:** For floating Modals, use a sprawling shadow: `box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 15px rgba(182, 160, 255, 0.05);`. The second value is a "Primary Tint" shadow that mimics the glow of a neon screen.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline_variant` at 15% opacity. Never use pure white or high-contrast gray.

---

## 5. Components

### Buttons: The Luminous Pulse
- **Primary:** Background `primary_dim` (#7e51ff). On hover, add a subtle outer glow (0 0 12px) using `primary`.
- **Secondary:** Transparent background with a `primary` "Ghost Border."
- **Tertiary/Ghost:** No background, `primary` text. Used for low-priority actions like "Cancel."

### Input Fields: The Recessed Inkwell
- **State - Default:** `surface_container_lowest` background. No border.
- **State - Focus:** A 1px "Glowing" border using `primary`. The background shifts slightly to `surface_container_low`. 
- **Minimalism:** Labels should use `label-md` and be placed 4px above the field, never inside.

### Cards & Lists: The Infinite Scroll
- **Rule:** Forbid divider lines. Use 16px of vertical whitespace to separate list items.
- **Hover State:** Upon hovering a list item, shift the background to `surface_container_highest` and apply a 2px left-accent border of `secondary`.

### Data Visualization: The Neon Pulse
- Graphs should use `primary` and `secondary` for data lines.
- Fill the area under the curve with a gradient: `primary` (10% opacity) to `surface` (0% opacity).
- Use `tertiary` (#ff97b8) exclusively for "Conflict" or "Critical Plot Point" flags in story timelines.

---

## 6. Do's and Don'ts

### Do:
- **Use "Breathing Room":** If a design feels cluttered, increase padding by 8px before removing elements.
- **Embrace Asymmetry:** In the dashboard, align the "Main Manuscript" card to the left and "Character Notes" to a narrower right column to break the "grid" feel.
- **Color Accents:** Use `secondary_dim` (#ba85fb) for "In-Progress" states and `tertiary_fixed` (#ff8db2) for "Milestone Reached" alerts.

### Don't:
- **No 100% Grays:** Never use `#808080` or similar neutrals. Use the `outline` (#767579) token which is slightly tinted toward the Indigo palette.
- **No Sharp Corners:** Always follow the Roundedness Scale. The `lg` (0.5rem) is the standard for cards; `none` is strictly forbidden unless for full-bleed images.
- **No Heavy Shadows:** If the shadow is the first thing you see, it’s too dark. It should be felt, not seen.

---

## 7. App-Specific Components: The "Writer's Suite"

- **The Focus Ribbon:** A floating, glassmorphic bar containing word count and "Sprint" timers. It should use `surface_container` at 60% opacity with a high `backdrop-blur`.
- **The Plot Threader:** A custom horizontal timeline component using `primary_container` dots connected by `outline_variant` dashed lines (at 30% opacity).
- **The Character Portal:** Circular avatars with a `secondary` glow-ring when that character is "Active" in the current chapter's metadata.```