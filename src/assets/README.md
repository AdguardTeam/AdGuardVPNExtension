# Assets

This directory contains all the assets used in the project. This includes images, fonts, etc.

## How to add

You can place asset in any place in the project (`src/assets` preferred), except following directories:
- `src/assets/images/icons`
- `src/assets/images/flags`
- `src/assets/prebuild-data`

Because contents of these directories will be fully copied to build directory as is,
and in case if some assets are not used anymore in the project, it will be included in the final build,
which may increase the size of the final build unnecessarily.

## How to use

In order to use assets in project:

1. In `js` / `ts` files you can use by importing them:

```typescript
import somePngUrl from '../../assets/images/some.png';
import someSvgUrl from '../../assets/some/nesting/some.svg';
import someWebmUrl from '../../assets/videos/motion/some.webm';
```

Note that currently only `png`, `svg` and `webm` files are configured for import.
In order to use other types of files you can declare them in `src/declaration.d.ts` file:

```typescript
// For example, to declare jpeg files:
declare module '*.jpeg' {
    const content: string;
    export default content;
}
```

1. In `css` / `pcss` files you can use by referencing them:

```css
.some-class {
  background-image: url("../../assets/images/some.png");
}

.some-class {
  background-image: url("../../assets/some/nesting/some.svg");
}

@font-face {
    font-family: "Roboto";
    src: url("../../assets/fonts/roboto/regular.woff2") format("woff2"),
         url("../../assets/fonts/roboto/regular.woff") format("woff");
    font-weight: 400;
    font-style: normal;
}
```

Note that in both `js` and `css` you need to provide relative path to the asset from the file you are importing it in.

## Bundling

Project configured in a following way:
- All used `woff` / `woff2` / `eot` / `ttf` / `otf` files will be copied
  to `build/channel/browser/assets/fonts` directory.

- All used `svg` / `png` files will be copied
  to `build/channel/browser/assets/images` directory.

- All used `webm` files will be copied
  to `build/channel/browser/assets/videos` directory.

- All files from `src/assets/images/icons` directory will be copied
  to `build/channel/browser/assets/images/icons` directory.

- All files from `src/assets/images/flags` directory will be copied
  to `build/channel/browser/assets/images/flags` directory.

- All files from `src/assets/prebuild-data` directory will be copied
  to `build/channel/browser/assets/prebuild-data` directory.

Where `channel` is the current build channel (`dev` / `beta` / `release`)
and `browser` is the current build target (`chrome` / `firefox` / `edge` / etc).

**All used**: means that only assets that are imported inside of `js` / `ts` and referenced in `css` / `pcss`.
This way only the assets that are actually used in the project will be included in the final build.

About specific directories:
Contents of these directories is fully copied to build directory as is because they are used in a way that
`webpack` can't track their usage, so add assets here only if you are sure what you are doing.

Usage of these directories:
- `src/assets/images/icons` - contains extension icons, which are used in `manifest.json`
  and `browser_action` / `page_action` / `theme` sections of the extension.

- `src/assets/images/flags` - contains country flags images, which are dynamically loaded
  in the project based on the demand.

- `src/assets/prebuild-data` - contains built-in data that is used in the project,
  but can't be imported directly in `js` / `ts` files to fulfill Firefox extension
  requirements: Max `4MB` file `js` size.
