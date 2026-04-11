Fixes a bug where the dashboard layout was glitchy and un-structured.

The issue was caused by using `min-h-screen` instead of `h-screen` for the dashboard container, while the `main` content section had `overflow-y-auto`. Because the container could grow infinitely (`min-h-screen`), the `<main>` element would never trigger scrolling. Instead, the entire document (body) would scroll.

This disrupted the fixed position of the sidebar, and more importantly, caused the floating "Global Mentor" agent (which was absolutely positioned using `absolute inset-0`) to be pushed off the screen rather than staying fixed relative to the viewport.

Changing the container definitions to `h-screen` and adding `overflow-hidden` fixes the bug. The layout is now constrained to the viewport height, and the main content scrolls internally without disrupting the layout or hiding the mentor element.
