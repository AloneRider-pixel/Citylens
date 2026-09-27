## 2024-05-19 - Missing ARIA Labels on Modal Action Buttons
**Learning:** Found multiple instances where icon-only action buttons (like close, share, and delete) inside modals lacked `aria-label` attributes, relying solely on `title` which is insufficient for many screen readers.
**Action:** Always ensure `aria-label` is present alongside or instead of `title` for any icon-only interactive elements across the application to support screen reader users effectively.
\n## 2025-05-24 - ARIA Labels on Icon Buttons\n**Learning:** Users with screen readers may struggle with icon buttons in AR interfaces. Adding aria-labels makes these buttons accessible without changing visual layouts.\n**Action:** Ensure all icon buttons in complex AR/VR interfaces have clear aria-labels.
