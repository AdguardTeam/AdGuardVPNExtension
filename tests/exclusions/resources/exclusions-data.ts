import { ExclusionStates } from '../../../src/common/exclusionsConstants';

export const testExclusionsData: any = {
    excludedServices: [
        {
            serviceId: 'github',
            serviceName: 'GitHub',
            iconUrl: 'https://icons.adguard.org/icon?domain=github.com',
            categories: {
                id: 'WORK',
                name: 'Work communication tools',
            },
            modifiedTime: '2021-09-14T10:23:00+0000',
            exclusionsGroups: [
                {
                    id: 'SkjPnPSMrEidrgkRLmd6h',
                    hostname: 'ghcr.io',
                    exclusions: [
                        {
                            id: '-rHx9Ay5UJLfOOhMMC2Uq',
                            hostname: 'ghcr.io',
                            enabled: ExclusionStates.Enabled,
                        },
                        {
                            id: 'jyclVWHOjIL0FWLZTfb2t',
                            hostname: '*.ghcr.io',
                            enabled: ExclusionStates.Enabled,
                        },
                    ],
                    state: ExclusionStates.Enabled,
                },
                {
                    id: 'CGinYTAxmw7ufr31o1CKG',
                    hostname: 'github.com',
                    exclusions: [
                        {
                            id: 'sGzDW0lhUzcywW0j2bfFR',
                            hostname: 'github.com',
                            enabled: ExclusionStates.Enabled,
                        },
                        {
                            id: 'y2_AhtrQP_Ae5eBwsh8QI',
                            hostname: '*.github.com',
                            enabled: ExclusionStates.Enabled,
                        },
                    ],
                    state: ExclusionStates.Enabled,
                },
                {
                    id: 'FMa_zQlXzWL5BUu9ZOiZg',
                    hostname: 'github.io',
                    exclusions: [
                        {
                            id: 'PoYhyAgPIQPOn-DfPlw7A',
                            hostname: 'github.io',
                            enabled: ExclusionStates.Enabled,
                        },
                        {
                            id: 'XgwqF54rRSXJ0h1pYomD9',
                            hostname: '*.github.io',
                            enabled: ExclusionStates.Enabled,
                        },
                    ],
                    state: ExclusionStates.Enabled,
                },
                {
                    id: 'xdy8LKxjYxKuq43OETpUr',
                    hostname: 'githubapp.com',
                    exclusions: [
                        {
                            id: '04J1Vz-TYw123Ht4DWGWV',
                            hostname: 'githubapp.com',
                            enabled: ExclusionStates.Enabled,
                        },
                        {
                            id: 'jFbOJb7dpkQmdZHZFxhQp',
                            hostname: '*.githubapp.com',
                            enabled: ExclusionStates.Enabled,
                        },
                    ],
                    state: ExclusionStates.Enabled,
                },
                {
                    id: 'nGkpMW-t-W5Dej0k0wA_o',
                    hostname: 'githubassets.com',
                    exclusions: [
                        {
                            id: 'XUGlocJVu5xMOYeoocSC3',
                            hostname: 'githubassets.com',
                            enabled: ExclusionStates.Enabled,
                        },
                        {
                            id: 'U8sOwhCxdhvr9LulgAh_D',
                            hostname: '*.githubassets.com',
                            enabled: ExclusionStates.Enabled,
                        },
                    ],
                    state: ExclusionStates.Enabled,
                },
                {
                    id: '1l9afcX-R6yYzt2wopsM0',
                    hostname: 'githubusercontent.com',
                    exclusions: [
                        {
                            id: 'z5rCepkLEScPdZ4h7hAMi',
                            hostname: 'githubusercontent.com',
                            enabled: ExclusionStates.Enabled,
                        },
                        {
                            id: 'vi2jQQ-1bjsmUnzLEJyzf',
                            hostname: '*.githubusercontent.com',
                            enabled: ExclusionStates.Enabled,
                        },
                    ],
                    state: ExclusionStates.Enabled,
                },
            ],
            state: ExclusionStates.Enabled,
        },
    ],
    exclusionsGroups: [
        {
            id: 'dmIgiek1B6BpzER_YSCmL',
            hostname: 'example.org',
            exclusions: [
                {
                    id: 'RJMwFQORRkgsTruzzaWNe',
                    hostname: 'example.org',
                    enabled: ExclusionStates.Enabled,
                },
                {
                    id: 'lBvG7kSOfb52g2rs-H6k0',
                    hostname: '*.example.org',
                    enabled: ExclusionStates.Enabled,
                },
            ],
            state: ExclusionStates.Enabled,
        },
    ],
    excludedIps: [
        {
            id: '5pkJQyFxPu8KJkZBqQnk_',
            hostname: '192.168.35.41',
            enabled: ExclusionStates.Enabled,
        },
    ],
};
