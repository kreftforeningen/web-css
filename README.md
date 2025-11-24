# @kreftforeningen/web-css

Style variables for Kreftforeningen.

## Installation

- `pnpm add @kreftforeningen/web-css`
- `@import "@kreftforeningen/web-css";` at the top of your main css file

## Content

### Semantic elements

Basic styling for semantic elements such as:

- Headings
- Blockquote

### Colors

Colors in oklch. Main colors also in hex.

- KF Blue
- KF Green
- KF Orange
- KF Red
- KF Pink
- KF Purple
- Gray
- Black
- White
- Vipps

### Fonts

- IBM Plex Sans
- IBM Plex Condesed
- IBM Plex Serif

### Animations

- Pulsating text
- Fade in / fade out

## Color Extraction

To extract all color variables from the CSS into JSON files, run:

```sh
pnpm run build
```

This will generate:

- `json/colors.json` with all `--kf-color-*` variables
- `json/vipps-colors.json` with `--vipps-color-*` variables
- `json/pink-ribbon-colors.json` with `--pink-ribbon-color-*` variables

## NPM.js

This git is published as a package on https://www.npmjs.com/package/@kreftforeningen/web-css
