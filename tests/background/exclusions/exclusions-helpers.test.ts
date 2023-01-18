import _ from 'lodash';

import { ExclusionState } from '../../../src/common/exclusionsConstants';
import {
    complementedExclusionsWithServices,
    complementExclusions,
} from '../../../src/background/exclusions/exclusions-helpers';
import { ExclusionInterface } from '../../../src/background/exclusions/exclusions/exclusionsTypes';
import { ServicesInterface } from '../../../src/background/providers/vpnProvider';

jest.mock('../../../src/lib/logger.ts');

const ignoreId = (exclusions: ExclusionInterface[]) => {
    return exclusions.map((ex) => ({ hostname: ex.hostname, state: ex.state }));
};

describe('exclusion-helpers', () => {
    describe('complementExclusions', () => {
        it('adds wildcard exclusion if eTLD exclusion added', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.org', state: ExclusionState.Enabled },
            ];

            const complementedExclusions = complementExclusions(exclusions);

            expect(ignoreId(complementedExclusions)).toEqual(
                [
                    { hostname: 'example.org', state: ExclusionState.Enabled },
                    { hostname: '*.example.org', state: ExclusionState.Disabled },
                ],
            );
        });

        it('adds eTLD exclusion if wildcard exclusion added', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: '*.example.org', state: ExclusionState.Enabled },
            ];

            const complementedExclusions = complementExclusions(exclusions);

            expect(ignoreId(complementedExclusions)).toEqual(
                [
                    { hostname: '*.example.org', state: ExclusionState.Enabled },
                    { hostname: 'example.org', state: ExclusionState.Disabled },
                ],
            );
        });

        it('adds eTLD and wildcard exclusion if subdomain added', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'test.example.org', state: ExclusionState.Enabled },
            ];

            const complementedExclusions = complementExclusions(exclusions);

            expect(_.sortBy(ignoreId(complementedExclusions), 'hostname')).toEqual(
                _.sortBy([
                    { hostname: 'example.org', state: ExclusionState.Disabled },
                    { hostname: '*.example.org', state: ExclusionState.Disabled },
                    { hostname: 'test.example.org', state: ExclusionState.Enabled },
                ], 'hostname'),
            );
        });

        it('keeps state of added exclusions', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'test.example.org', state: ExclusionState.Enabled },
                { id: '2', hostname: 'example.org', state: ExclusionState.Enabled },
            ];

            const complementedExclusions = complementExclusions(exclusions);

            expect(_.sortBy(ignoreId(complementedExclusions), 'hostname')).toEqual(
                _.sortBy([
                    { hostname: 'example.org', state: ExclusionState.Enabled },
                    { hostname: '*.example.org', state: ExclusionState.Disabled },
                    { hostname: 'test.example.org', state: ExclusionState.Enabled },
                ], 'hostname'),
            );
        });
    });

    describe('complements exclusions with service domains', () => {
        it('complements exclusions from services', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.org', state: ExclusionState.Enabled },
            ];

            const services: ServicesInterface = {
                example: {
                    serviceId: 'example',
                    serviceName: 'Example',
                    iconUrl: 'url',
                    modifiedTime: 'time',
                    categories: [{ id: 'shop', name: 'shop' }],
                    domains: ['example.org', 'example.net'],
                },
            };

            const complementedExclusions = complementedExclusionsWithServices(exclusions, services);

            expect(_.sortBy(ignoreId(complementedExclusions), 'hostname')).toEqual(
                _.sortBy([
                    { hostname: 'example.org', state: ExclusionState.Enabled },
                    { hostname: '*.example.org', state: ExclusionState.Disabled },
                    { hostname: 'example.net', state: ExclusionState.Disabled },
                    { hostname: '*.example.net', state: ExclusionState.Disabled },
                ], 'hostname'),
            );
        });

        it('complements exclusions from services and does not add duplicates', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.org', state: ExclusionState.Enabled },
                { id: '2', hostname: '*.example.net', state: ExclusionState.Enabled },
            ];

            const services: ServicesInterface = {
                example: {
                    serviceId: 'example',
                    serviceName: 'Example',
                    iconUrl: 'url',
                    modifiedTime: 'time',
                    categories: [{ id: 'shop', name: 'shop' }],
                    domains: ['example.org', 'example.net'],
                },
            };

            const complementedExclusions = complementedExclusionsWithServices(exclusions, services);

            expect(_.sortBy(ignoreId(complementedExclusions), 'hostname')).toEqual(
                _.sortBy([
                    { hostname: 'example.org', state: ExclusionState.Enabled },
                    { hostname: '*.example.org', state: ExclusionState.Disabled },
                    { hostname: 'example.net', state: ExclusionState.Disabled },
                    { hostname: '*.example.net', state: ExclusionState.Enabled },
                ], 'hostname'),
            );
        });

        it('does not lose exclusions without service', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.org', state: ExclusionState.Enabled },
                { id: '2', hostname: '*.example.net', state: ExclusionState.Enabled },
                { id: '3', hostname: 'example.com', state: ExclusionState.Enabled },
            ];

            const services: ServicesInterface = {
                example: {
                    serviceId: 'example',
                    serviceName: 'Example',
                    iconUrl: 'url',
                    modifiedTime: 'time',
                    categories: [{ id: 'shop', name: 'shop' }],
                    domains: ['example.org', 'example.net'],
                },
            };

            const complementedExclusions = complementedExclusionsWithServices(exclusions, services);

            expect(_.sortBy(ignoreId(complementedExclusions), 'hostname')).toEqual(
                _.sortBy([
                    { hostname: 'example.org', state: ExclusionState.Enabled },
                    { hostname: '*.example.org', state: ExclusionState.Disabled },
                    { hostname: 'example.net', state: ExclusionState.Disabled },
                    { hostname: '*.example.net', state: ExclusionState.Enabled },
                    { hostname: 'example.com', state: ExclusionState.Enabled },
                ], 'hostname'),
            );
        });

        it('adds disabled services', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.org', state: ExclusionState.Disabled },
                { id: '2', hostname: '*.example.net', state: ExclusionState.Disabled },
                { id: '3', hostname: 'example.com', state: ExclusionState.Disabled },
            ];

            const services: ServicesInterface = {
                example: {
                    serviceId: 'example',
                    serviceName: 'Example',
                    iconUrl: 'url',
                    modifiedTime: 'time',
                    categories: [{ id: 'shop', name: 'shop' }],
                    domains: ['example.org', 'example.net'],
                },
            };

            const complementedExclusions = complementedExclusionsWithServices(exclusions, services);

            expect(_.sortBy(ignoreId(complementedExclusions), 'hostname')).toEqual(
                _.sortBy([
                    { hostname: 'example.org', state: ExclusionState.Disabled },
                    { hostname: '*.example.org', state: ExclusionState.Disabled },
                    { hostname: 'example.net', state: ExclusionState.Disabled },
                    { hostname: '*.example.net', state: ExclusionState.Disabled },
                    { hostname: 'example.com', state: ExclusionState.Disabled },
                ], 'hostname'),
            );
        });
    });
});
