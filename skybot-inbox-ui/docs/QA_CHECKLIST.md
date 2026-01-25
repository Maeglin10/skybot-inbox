# QA Checklist

This document serves as a manual QA checklist to be executed before every release to prevent visual regressions and layout bugs.

## 1. Visual Identity Verification

### Colors
- [ ] **Primary Accent**: Verify buttons and active states use Violet (`#9E398D` / `hsl(310, 48%, 42%)`).
- [ ] **Secondary Accent**: Verify borders or subtle backgrounds use Dark Violet (`#521E49` / `hsl(310, 46%, 22%)`).
- [ ] **Text**: Verify labels are Neutral Gray (`#939AA1` / `hsl(210, 7%, 55-60%)`).
- [ ] **Background**: Verify default Dark Mode background is Black (`#000000`).

### Theme Switcher
- [ ] Switching to **Default** restores the brand colors mentioned above.
- [ ] Switching Mode (Light/Dark) correctly inverts text/background but maintains brand identity if applicable.

## 2. Scroll & Layout Smoke Tests

### Routes
Visit the following routes and verify that the main content area scrolls when content overflows, but the Sidebar remains sticky.

- [ ] **/inbox**: Thread list should scroll independently.
- [ ] **/crm**: Table should scroll vertically.
- [ ] **/analytics**: Dashboard should scroll vertically.
- [ ] **/settings**: Settings page should scroll vertically.
- [ ] **/alerts**: Alerts list should scroll vertically.

### Layout Stability
- [ ] **Resize**: Resize window to smaller height. Ensure headers do not disappear and scrollbars appear correctly.
- [ ] **Mobile**: (Optional) Check layout does not break on smaller widths (responsive constraints).

## 3. Functionality

### Preferences
- [ ] Changing Language in Settings updates the Sidebar labels immediately.
- [ ] Changing Theme in Settings updates the UI immediately.
- [ ] Preferences persist after page reload.
