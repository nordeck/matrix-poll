# @nordeck/matrix-poll-widget

## 1.3.1

### Patch Changes

- 78d027b: Release patch version with updated dependencies from main

## 1.3.0

### Minor Changes

- 61dbf02: Add the option to manually end a poll immediately to shorten it if everyone already voted.

### Patch Changes

- 56f2879: Only allow integers for poll durations.
- 8019507: Unify the diagrams colors of the answer options for the poll result chart in light and dark theme.
- f98d77a: Improve performance by only generating the PDF if the user requests it.

## 1.2.0

### Minor Changes

- e357d9e: Show error and loading states for votes on the poll cards.

### Patch Changes

- 2937b97: Set document language to improve accessibility.
- ab13e23: Fix creating meeting without description if `REACT_APP_POLL_DESCRIPTION_REQUIRED` is not set.

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
