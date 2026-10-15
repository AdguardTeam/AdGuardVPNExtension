import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Geometry contract of the popup profile menu.
 *
 * The menu is bottom-anchored to the switcher and capped by the screen height
 * (`max-height: calc(100dvh - 100% - Npx)`), so its position cannot be checked
 * in jsdom. Instead this test recomputes the popup layout from the CSS sources
 * (header, paddings, status row, switcher) and verifies that the cap always
 * keeps the menu inside the screen, for any popup height and for both promo
 * banner states.
 *
 * A failure means either the layout moved the switcher up (increase the
 * constant in `profile-switcher.module.pcss`) or the parsed sources were
 * restructured (update the selectors below).
 */

const SRC_DIR = path.resolve(__dirname, '../../../../src');

/** Free space that must stay between the menu and the top of the screen. */
const MIN_MARGIN_PX = 8;

/** Popup height range: 598px on desktop, 550px or more on mobile browsers. */
const POPUP_HEIGHT_MIN = 550;
const POPUP_HEIGHT_MAX = 900;

/**
 * Reads a source file relative to the `src` directory.
 * @param relativePath Path inside `src`.
 * @returns File contents.
 */
function readSource(relativePath: string): string {
    return readFileSync(path.resolve(SRC_DIR, relativePath), 'utf8');
}

/**
 * Extracts the body of a rule by its selector, e.g. `.menu`.
 * @param source File contents.
 * @param selector Rule selector.
 * @returns The rule body.
 */
function readRule(source: string, selector: string): string {
    const escaped = selector.replace(/\./g, '\\.');
    const match = source.match(new RegExp(`${escaped} \\{([\\s\\S]*?)\\n\\}`));

    if (!match) {
        throw new Error(`Cannot find the "${selector}" rule: the sources changed, update this test`);
    }

    return match[1];
}

/**
 * Reads the first capture group of the pattern as a number.
 * @param source Text to search in.
 * @param pattern Pattern with a single capture group.
 * @param label Human readable name used in the error message.
 * @returns The parsed number.
 */
function readNumber(source: string, pattern: RegExp, label: string): number {
    const match = source.match(pattern);

    if (!match) {
        throw new Error(`Cannot find ${label}: the sources changed, update this test`);
    }

    return Number(match[1]);
}

const vars = readSource('popup/styles/vars.pcss');
const settings = readSource('popup/components/Settings/settings.pcss');
const status = readSource('popup/components/Settings/Status/status.pcss');
const common = readSource('popup/styles/common.pcss');
const promo = readSource('popup/components/MobileEdgePromo/mobile-edge-promo-banner.pcss');
const icon = readSource('common/components/Icons/Icon.tsx');

const switcherRule = readRule(readSource(
    'popup/components/Profiles/ProfileSwitcher/profile-switcher.module.pcss',
), '.menu');
const settingsRule = readRule(settings, '.settings');
const statusRule = readRule(status, '.status');
const buttonRule = readRule(
    readSource('popup/components/Profiles/ProfileSwitcher/profile-switcher.module.pcss'),
    '.button',
);

/** Default popup height on desktop (`--popup-default-height`). */
const POPUP_DEFAULT_HEIGHT = readNumber(vars, /--popup-default-height:\s*(\d+)px/, '--popup-default-height');

/** Header height (`--header-height`). */
const HEADER_HEIGHT = readNumber(vars, /--header-height:\s*(\d+)px/, '--header-height');

/** Root font size, the popup uses rem sizes based on it. */
const ROOT_FONT_SIZE = readNumber(common, /html \{[\s\S]*?font-size:\s*(\d+)px/, 'html font-size');

/** `.settings` padding-top. */
const SETTINGS_PADDING_TOP = readNumber(settingsRule, /padding:\s*(\d+)px/, '.settings padding-top');

/** `.settings__main` padding-top: the minimum and the design value. */
const MAIN_PADDING_MIN = readNumber(settingsRule, /padding-top:\s*max\(\s*(\d+)px/, '.settings__main min padding');
const MAIN_PADDING_BASE = readNumber(settingsRule, /calc\(\s*(\d+)px - var\(--popup-default-height\)/, '.settings__main base padding');

/** Promo banner height: it pushes the content down and is subtracted from the padding. */
const PROMO_BANNER_HEIGHT = readNumber(promo, /height:\s*(\d+)px/, 'promo banner height');

/** Status row above the switcher: its line height plus the bottom margin. */
const STATUS_HEIGHT = readNumber(statusRule, /line-height:\s*(\d+)px/, '.status line-height')
    + readNumber(statusRule, /margin-bottom:\s*(\d+)px/, '.status margin-bottom');

/** The cap constant of the menu. */
const MENU_CAP_PX = readNumber(switcherRule, /max-height:\s*calc\(100dvh - 100% - (\d+)px\)/, 'menu max-height');

/** Switcher height: the tallest child (icon or text) plus the button paddings. */
const ICON_SIZE = readNumber(icon, /size = '(\d+)'/, 'Icon default size');
const BUTTON_PADDING_Y = readNumber(buttonRule, /padding:\s*(\d+)px/, '.button padding');
const BUTTON_FONT_SIZE = readNumber(buttonRule, /font-size:\s*([\d.]+)rem/, '.button font-size') * ROOT_FONT_SIZE;
const BUTTON_LINE_HEIGHT = readNumber(buttonRule, /line-height:\s*([\d.]+)/, '.button line-height');
const SWITCHER_HEIGHT = Math.max(ICON_SIZE, BUTTON_FONT_SIZE * BUTTON_LINE_HEIGHT) + 2 * BUTTON_PADDING_Y;

/**
 * Y coordinate of the switcher's top edge.
 * The switcher sits below the promo banner, the header, the settings paddings
 * and the status row. The banner height is subtracted from the padding, so the
 * switcher keeps its place when the banner appears.
 * @param popupHeight Height of the popup viewport.
 * @param promoHeight Height of the promo banner, 0 when it is not rendered.
 * @returns The coordinate of the switcher's top edge.
 */
function getSwitcherTop(popupHeight: number, promoHeight: number): number {
    return promoHeight
        + HEADER_HEIGHT
        + SETTINGS_PADDING_TOP
        + Math.max(
            MAIN_PADDING_MIN,
            MAIN_PADDING_BASE - POPUP_DEFAULT_HEIGHT + popupHeight - promoHeight,
        )
        + STATUS_HEIGHT;
}

describe('popup profile menu geometry', () => {
    it('anchors the menu to the switcher and caps it by the viewport', () => {
        expect(switcherRule).toMatch(/position:\s*absolute/);
        expect(switcherRule).toMatch(/bottom:\s*100%/);
        expect(switcherRule).toMatch(/max-height:\s*calc\(100dvh - 100% - \d+px\)/);
    });

    it('keeps the menu inside the screen for any popup height', () => {
        const popupHeights = Array.from(
            { length: POPUP_HEIGHT_MAX - POPUP_HEIGHT_MIN + 1 },
            (_, index) => POPUP_HEIGHT_MIN + index,
        );

        // The menu's bottom edge is pinned to the switcher's top edge, so the
        // cap leaves the menu at most this tall.
        const worst = popupHeights
            .flatMap((popupHeight) => [0, PROMO_BANNER_HEIGHT].map((promoHeight) => {
                const menuHeight = popupHeight - SWITCHER_HEIGHT - MENU_CAP_PX;

                return {
                    margin: getSwitcherTop(popupHeight, promoHeight) - menuHeight,
                    popupHeight,
                    promoHeight,
                };
            }))
            .reduce((min, candidate) => (candidate.margin < min.margin ? candidate : min));

        expect(
            worst.margin,
            `The menu would go ${Math.ceil(-worst.margin)}px off-screen: at popup height `
            + `${worst.popupHeight}px and promo banner ${worst.promoHeight}px the switcher is at `
            + `${getSwitcherTop(worst.popupHeight, worst.promoHeight)}px, while the menu can be `
            + `${worst.popupHeight - SWITCHER_HEIGHT - MENU_CAP_PX}px tall. `
            + 'Increase the constant in profile-switcher.module.pcss',
        ).toBeGreaterThanOrEqual(MIN_MARGIN_PX);
    });
});
