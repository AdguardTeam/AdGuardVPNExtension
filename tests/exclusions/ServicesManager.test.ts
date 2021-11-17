import {ExclusionsGroup} from "../../src/background/exclusions/ExclusionsGroup";

const SERVICES_DATA = [{
    serviceId: 'facebook',
    serviceName: 'Facebook',
    categories: ['SOCIAL_NETWORKS'],
    iconUrl: 'https://icons.adguard.org/icon?domain=facebook.com',
    modifiedTime: '2021-09-14T10:23:00+0000',
    exclusionsGroups: [
        new ExclusionsGroup('facebook.com'),
        new ExclusionsGroup('facebook.net'),
        new ExclusionsGroup('fb.com'),
        new ExclusionsGroup('fb.gg'),
        new ExclusionsGroup('fbcdn.net'),
    ],
},
    {
        serviceId: 'github',
        serviceName: 'GitHub',
        categories: ['WORK'],
        iconUrl: 'https://icons.adguard.org/icon?domain=github.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        exclusionsGroups: [
            new ExclusionsGroup('github.com'),
            new ExclusionsGroup('github.io'),
            new ExclusionsGroup('githubapp.com'),
            new ExclusionsGroup('githubassets.com'),
            new ExclusionsGroup('githubusercontent.com'),
            new ExclusionsGroup('ghcr.io'),

        ],
    },
];
