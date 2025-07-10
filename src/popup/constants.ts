import { AppearanceTheme } from '../common/constants';
import lightOnMotionUrl from '../assets/motion/on-light.webm';
import lightOffMotionUrl from '../assets/motion/off-light.webm';
import lightSwitchOnMotionUrl from '../assets/motion/switch-on-light.webm';
import lightSwitchOffMotionUrl from '../assets/motion/switch-off-light.webm';
import darkOnMotionUrl from '../assets/motion/on-dark.webm';
import darkOffMotionUrl from '../assets/motion/off-dark.webm';
import darkSwitchOnMotionUrl from '../assets/motion/switch-on-dark.webm';
import darkSwitchOffMotionUrl from '../assets/motion/switch-off-dark.webm';

export const enum AnimationState {
    // Initial state
    VpnDisabledIdle = 'vpnDisabledIdle',
    VpnEnabled = 'vpnEnabled',
    VpnDisabled = 'vpnDisabled',
    VpnConnecting = 'vpnConnecting',
    VpnDisconnecting = 'vpnDisconnecting',
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
        [AnimationState.VpnEnabled]: lightOnMotionUrl,
        [AnimationState.VpnSwitchingLocation]: lightOnMotionUrl,
        [AnimationState.VpnDisabled]: lightOffMotionUrl,
        [AnimationState.VpnDisabledIdle]: lightOffMotionUrl,
        [AnimationState.VpnConnecting]: lightSwitchOnMotionUrl,
        [AnimationState.VpnDisconnecting]: lightSwitchOffMotionUrl,
    },
    [AppearanceTheme.Dark]: {
        [AnimationState.VpnEnabled]: darkOnMotionUrl,
        [AnimationState.VpnSwitchingLocation]: darkOnMotionUrl,
        [AnimationState.VpnDisabled]: darkOffMotionUrl,
        [AnimationState.VpnDisabledIdle]: darkOffMotionUrl,
        [AnimationState.VpnConnecting]: darkSwitchOnMotionUrl,
        [AnimationState.VpnDisconnecting]: darkSwitchOffMotionUrl,
    },
};
