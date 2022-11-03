# @nordeck/matrix-poll-widget

## 1.1.0

### Minor Changes

- 97a4875: Change the create group dialog to create only a single group.
- d4b6e8f: Rework the user interface to resolve accessibility issues and comply to BITV 2.0 and WCAG 2.1.
  Notable changes are:

  - Screen reader users can now interact with the widget.
  - The widget is now keyboard accessible.
  - Adds support for a high contrast theme for visually impaired users.
  - Removed the splitter component from the poll lists.
  - The poll results are displayed in a table as an alternative to the chart.
  - Changes to polls, like started and ending polls, are announced to screen reader users.
  - General theme updates to better match the Element theme.

- d01792e: Edit groups in a modal view that mirrors the group creation process

### Patch Changes

- 9c57462: Add support for for `arm64` and `s390x` arch.
- c48b8e8: Keep the path when registering the admin view using `/addwidget`.
- 37f8186: Add warning message to the start poll dialog if no voters are participating in the poll.

## 1.0.3

### Patch Changes

- c901e28: Show guests the correct message when they wait to see results for visible and invisible polls.

## 1.0.2

### Patch Changes

- 7fd7fe2: Include `LICENSE` file in container output and define concluded licenses in case of dual licenses.

## 1.0.1

### Patch Changes

- 1e2d20f: Include a `licenses.json` in the container image, which includes a list of all dependencies and their licenses.

## 1.0.0

### Major Changes

- fe1adbe: Initial release
