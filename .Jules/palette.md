## 2024-05-19 - Missing ARIA Labels on Modal Action Buttons
**Learning:** Found multiple instances where icon-only action buttons (like close, share, and delete) inside modals lacked `aria-label` attributes, relying solely on `title` which is insufficient for many screen readers.
**Action:** Always ensure `aria-label` is present alongside or instead of `title` for any icon-only interactive elements across the application to support screen reader users effectively.

## 2026-09-26 - Missing Keyboard and Screen Reader Accessibility on Custom Div Buttons
**Learning:** Found multiple instances where critical interactive elements (like the main camera and upload cards in PhotoUploader) were built as `div` elements relying solely on `onClick`, completely blocking keyboard users (Tab navigation, Enter/Space activation) and hiding their interactive nature from screen readers.
**Action:** Always verify that any interactive element not using a semantic `<button>` or `<a>` tag receives `role="button"`, `tabIndex={0}`, `onKeyDown` support, descriptive `aria-label` (if icon-only or visually complex), and explicit `focus-visible` styling for keyboard focus indication.

## 2024-10-01 - Avoid Overriding Text with aria-label
**Learning:** Adding `aria-label` to buttons that contain visible text and dynamic content (e.g., a notification badge) causes screen readers to completely ignore the inner text. This is a severe accessibility regression rather than an improvement.
**Action:** Only apply `aria-label` to genuinely icon-only interactive elements. For elements with visible text, rely on their semantic content and avoid redundant or overriding labels unless providing necessary supplementary context (e.g., `aria-describedby`).
## 2024-03-20 - Dynamic Drag-and-Drop Feedback
**Learning:** During file upload interactions, retaining generic placeholder text (like "Upload City Photo") while the user is actively dragging a file over a dropzone causes cognitive friction. Without explicit textual confirmation, users may feel uncertain if the dropzone is active.
**Action:** When a `dragover` event is active, immediately substitute the primary call-to-action text with direct instructional feedback (e.g., "Drop Photo Here!") to provide absolute clarity that the drop action will be successfully captured.
