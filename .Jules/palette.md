## 2024-05-19 - Missing ARIA Labels on Modal Action Buttons
**Learning:** Found multiple instances where icon-only action buttons (like close, share, and delete) inside modals lacked `aria-label` attributes, relying solely on `title` which is insufficient for many screen readers.
**Action:** Always ensure `aria-label` is present alongside or instead of `title` for any icon-only interactive elements across the application to support screen reader users effectively.
## 2023-10-25 - Form label accessibility missing in modals and headers
**Learning:** Found a recurring pattern in the app where form controls (like `<select>` and `<input>`) lack proper programmatic labeling via the `<label htmlFor="...">` and `id="..."` attributes, or completely missing `aria-label` for icon-only buttons on visual headers and modals.
**Action:** Ensure all form controls are programmatically associated with visual text labels, and add `aria-label` to inputs that may be visually hidden on smaller screens (like the Voice selector in the header). Use this pattern going forward for forms and buttons in the design system.
