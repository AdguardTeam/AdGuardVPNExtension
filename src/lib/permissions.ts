import browser from 'webextension-polyfill';

import { getErrorMessage } from '../common/utils/error';

import { log } from './logger';

/**
 * This class manages browser permissions.
 * It can be called as from background page as from other pages: e.g. options, popup.
 */
export class Permissions {
    /**
     * Host permissions that are needed for the extension to work.
     * The same are specified in the manifest.json.
     */
    private static NEEDED_HOST_ORIGINS = [
        '<all_urls>',
    ];

    /**
     * Checks if host permissions are granted for the `origins`.
     *
     * @param origins Host permission origins.
     *
     * @returns True if browser.permissions contain the `origins`,
     * false otherwise or if failed to check (error is logged)
     */
    private static async hasHostPermissions(origins: browser.Manifest.MatchPattern[]): Promise<boolean> {
        const permissionsRequest = {
            origins,
        };

        try {
            return await browser.permissions.contains(permissionsRequest);
        } catch (e: unknown) {
            log.error(`Was not able to check if browser contains permission: "${origins}", error: "${getErrorMessage(e)}"`);
            return false;
        }
    }

    /**
     * Requests optional host permissions from user.
     *
     * Important: cannot be called from the background page
     * because, for example, Firefox requires that the request is initiated by a user action.
     *
     * @param origins Host permission origins.
     *
     * @throws Error if failed to request permission due to browser error or user.
     */
    private static async addHostPermissions(origins: browser.Manifest.MatchPattern[]): Promise<void> {
        const permissionsRequest = {
            origins,
        };

        try {
            await browser.permissions.request(permissionsRequest);
        } catch (e) {
            throw new Error(`Was not able to add permission: "${origins}", error: "${getErrorMessage(e)}"`);
        }
    }

    /**
     * Checks if needed host permissions are granted.
     *
     * @returns True if host permissions are granted for **all** {@link NEEDED_HOST_ORIGINS}.
     */
    static async hasNeededHostPermissions(): Promise<boolean> {
        const areAllHostPermissionsGranted = await Permissions.hasHostPermissions(Permissions.NEEDED_HOST_ORIGINS);
        const logMessage = areAllHostPermissionsGranted
            ? 'Host permissions for <all_urls> are OK'
            : 'Host permissions for <all_urls> are not granted';
        log.info(logMessage);
        return areAllHostPermissionsGranted;
    }

    /**
     * Requests host permission for {@link NEEDED_HOST_ORIGINS}.
     */
    static async addNeededHostPermissions(): Promise<void> {
        await Permissions.addHostPermissions(Permissions.NEEDED_HOST_ORIGINS);
    }
}
