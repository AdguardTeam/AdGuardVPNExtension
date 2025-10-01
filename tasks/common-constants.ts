/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { Browser } from './consts';

export type BrowserConfig = {
    browser: Browser;
    devtools: boolean;
    buildDir: string;
    zipName: string;
};

export const BROWSERS_CONF: Record<Browser, BrowserConfig> = {
    [Browser.Chrome]: {
        browser: Browser.Chrome,
        devtools: true,
        buildDir: Browser.Chrome,
        zipName: Browser.Chrome,
    },
    [Browser.Firefox]: {
        browser: Browser.Firefox,
        devtools: false,
        buildDir: Browser.Firefox,
        zipName: Browser.Firefox,
    },
    [Browser.Opera]: {
        browser: Browser.Opera,
        devtools: true,
        buildDir: Browser.Opera,
        zipName: Browser.Opera,
    },
    [Browser.Edge]: {
        browser: Browser.Edge,
        devtools: true,
        buildDir: Browser.Edge,
        zipName: Browser.Edge,
    },
};
