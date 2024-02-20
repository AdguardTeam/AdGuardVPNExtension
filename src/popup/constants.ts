import { AppearanceTheme } from '../common/constants';

/**
 * Relative path to the folder with motion assets.
 */
const MOTION_FOLDER_PATH = '../assets/motion/';

export const enum AnimationState {
    // Initial state
    VpnDisabledIdle = 'vpnDisabledIdle',
    VpnEnabled = 'vpnEnabled',
    VpnDisabled = 'vpnDisabled',
    VpnConnecting = 'vpnConnecting',
    VpnDisconnecting = 'vpnDisconnecting',
    // on location switch we do not show animation
    VpnSwitchingLocation = 'vpnSwitchingLocation',
}

export const enum AnimationEvent {
    VpnConnected = 'vpnConnected',
    VpnDisconnected = 'vpnDisconnected',
    AnimationEnded = 'animationEnded',
    LocationSelected = 'locationSelected',
    VpnDisconnectedRetrying = 'vpnDisconnectedRetrying',
    ExclusionScreenDisplayed = 'exclusionScreenDisplayed',
}

type AnimationSourcesMap = {
    [key: string]: {
        [key: string]: string;
    }
};

export const animationSourcesMap: AnimationSourcesMap = {
    [AppearanceTheme.Light]: {
        [AnimationState.VpnEnabled]: `${MOTION_FOLDER_PATH}on-light.webm`,
        // Added this state for the case when switching location
        [AnimationState.VpnSwitchingLocation]: '',
        [AnimationState.VpnDisabled]: `${MOTION_FOLDER_PATH}off-light.webm`,
        [AnimationState.VpnDisabledIdle]: `${MOTION_FOLDER_PATH}off-light.webm`,
        [AnimationState.VpnConnecting]: `${MOTION_FOLDER_PATH}switch-on-light.webm`,
        [AnimationState.VpnDisconnecting]: `${MOTION_FOLDER_PATH}switch-off-light.webm`,
    },
    [AppearanceTheme.Dark]: {
        [AnimationState.VpnEnabled]: `${MOTION_FOLDER_PATH}on-dark.webm`,
        // Added this state for the case when switching location
        [AnimationState.VpnSwitchingLocation]: '',
        [AnimationState.VpnDisabled]: `${MOTION_FOLDER_PATH}off-dark.webm`,
        [AnimationState.VpnDisabledIdle]: `${MOTION_FOLDER_PATH}off-dark.webm`,
        [AnimationState.VpnConnecting]: `${MOTION_FOLDER_PATH}switch-on-dark.webm`,
        [AnimationState.VpnDisconnecting]: `${MOTION_FOLDER_PATH}switch-off-dark.webm`,
    },
};
