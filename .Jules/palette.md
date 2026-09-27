## 2024-05-19 - Missing ARIA Labels on Modal Action Buttons
**Learning:** Found multiple instances where icon-only action buttons (like close, share, and delete) inside modals lacked `aria-label` attributes, relying solely on `title` which is insufficient for many screen readers.
**Action:** Always ensure `aria-label` is present alongside or instead of `title` for any icon-only interactive elements across the application to support screen reader users effectively.

## 2024-05-18 - [Keyboard Accessibility for Custom Card Elements]
**Learning:** In React/Tailwind applications, complex visual cards used as primary actions (like upload/camera buttons) are often built with `div` elements for layout flexibility. This inherently breaks keyboard navigation and screen reader support unless specifically addressed.
**Action:** Always ensure that any interactive `div` used as a button includes `role="button"`, `tabIndex={0}`, an `onKeyDown` handler listening for `Enter` and `Space`, and clear `focus-visible` ring styling for keyboard users.
