## 2026-04-24 - ARIA labels for Icon-Only Buttons
**Learning:** Icon-only close buttons in the app's components (like Modal and Sidebar) frequently lack `aria-label` attributes and clear `focus-visible` states for keyboard navigation.
**Action:** When adding or modifying interactive SVG icons acting as buttons, always include an `aria-label` describing the action and add Tailwind's `focus-visible` utilities (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20`) to ensure accessibility.
