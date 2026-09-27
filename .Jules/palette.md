## 2024-05-19 - Missing ARIA Labels on Modal Action Buttons
**Learning:** Found multiple instances where icon-only action buttons (like close, share, and delete) inside modals lacked `aria-label` attributes, relying solely on `title` which is insufficient for many screen readers.
**Action:** Always ensure `aria-label` is present alongside or instead of `title` for any icon-only interactive elements across the application to support screen reader users effectively.

## 2024-05-20 - Adding ARIA labels and focus states to close buttons
**Learning:** Found additional instances in modal windows (`ShareTourModal`, `VRPanoramaViewer`) where icon-only "close" buttons (`<X />`) lacked proper `aria-label`s and visible focus states for keyboard navigation.
**Action:** Consistently apply `aria-label` and use `focus-visible:ring-2` (and `focus-visible:outline-none`) on icon-only buttons to ensure they are fully accessible to screen readers and keyboard users.
