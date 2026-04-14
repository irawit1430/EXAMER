## 2024-04-14 - Interactive Element Accessibility
**Learning:** In reusable or globally accessible components (like custom modals, sidebars, or interactive mentor messages), interactive custom elements or buttons often lack proper ARIA attributes, especially `aria-expanded` and `aria-label` for icon-only components.
**Action:** Always add `aria-expanded` attributes to buttons controlling expanding areas (like `MentorMessage.tsx`) and `aria-label` to icon-only buttons (like `Modal.tsx` and `Sidebar.tsx`) to clearly communicate their purpose and state to screen readers.
