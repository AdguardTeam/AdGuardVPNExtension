import { settings } from '../settings';
import appStatus from '../appStatus';
import credentials from '../credentials';
import { SETTINGS_IDS } from '../../lib/constants';
import exclusions from '../exclusions';

export class OptionsData {
    getOptionsData = async () => {
        const appVersion = appStatus.version;
        const username = await credentials.getUsername();
        const isRateVisible = settings.getSetting(SETTINGS_IDS.RATE_SHOW);
        const webRTCEnabled = settings.getSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED);
        const contextMenusEnabled = settings.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
        const helpUsImprove = settings.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);
        const dnsServer = settings.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER);
        const appearanceTheme = settings.getSetting(SETTINGS_IDS.APPEARANCE_THEME);

        const regularExclusions = exclusions.regular?.getExclusionsList();
        const selectiveExclusions = exclusions.selective?.getExclusionsList();
        const exclusionsCurrentMode = exclusions.current?.mode;

        const exclusionsData = {
            regular: regularExclusions,
            selective: selectiveExclusions,
            currentMode: exclusionsCurrentMode,
        };

        return {
            appVersion,
            username,
            isRateVisible,
            webRTCEnabled,
            contextMenusEnabled,
            helpUsImprove,
            dnsServer,
            appearanceTheme,
            exclusionsData,
        };
    }
}
