import { createMachine } from 'xstate';

import { Animation } from '../../../../lib/constants';

export enum VideoStateEvent {
    Connected = 'connected',
    Disconnected = 'disconnected',
    VideoEnded = 'video.ended',
}

export const videoStateMachine = createMachine({
    id: 'videoStateMachine',
    initial: Animation.Disconnected,
    states: {
        [Animation.Disconnected]: {
            on: {
                [VideoStateEvent.Connected]: {
                    target: Animation.SwitchOn,
                },
            },
        },
        [Animation.Connected]: {
            on: {
                [VideoStateEvent.Disconnected]: {
                    target: Animation.SwitchOff,
                },
            },
        },
        [Animation.SwitchOff]: {
            on: {
                [VideoStateEvent.VideoEnded]: {
                    target: Animation.Disconnected,
                },
                [VideoStateEvent.Connected]: {
                    target: Animation.SwitchOn,
                },
            },
        },
        [Animation.SwitchOn]: {
            on: {
                [VideoStateEvent.VideoEnded]: {
                    target: Animation.Connected,
                },
                [VideoStateEvent.Disconnected]: {
                    target: Animation.SwitchOff,
                },
            },
        },
    },
});
