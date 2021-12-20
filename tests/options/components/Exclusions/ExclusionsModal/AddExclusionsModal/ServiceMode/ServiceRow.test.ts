import {
    canAddService,
    ServiceInterface,
} from '../../../../../../../src/options/components/Exclusions/ExclusionsModal/AddExclusionsModal/ServiceMode/ServiceRow';
import { ExclusionStates } from '../../../../../../../src/common/exclusionsConstants';

const generateService = (props: Partial<ServiceInterface>): ServiceInterface => {
    const mockedService: ServiceInterface = {
        serviceId: 'string',
        serviceName: 'string',
        iconUrl: 'string',
        categories: [],
        modifiedTime: 'string',
        state: ExclusionStates.Enabled,
        domains: [],
    };

    return {
        ...mockedService,
        ...props,
    };
};

describe('ServiceRow', () => {
    describe('canAddService', () => {
        it('correctly decides button state for disabled service', () => {
            const service = generateService({ serviceId: 'first', state: ExclusionStates.Disabled });

            expect(canAddService(service, [])).toBeTruthy();
            expect(canAddService(service, ['first'])).toBeFalsy();
            expect(canAddService(service, ['second'])).toBeTruthy();
        });

        it('correctly decides button state for enabled or partly enabled service', () => {
            const enabledService = generateService({ serviceId: 'first', state: ExclusionStates.Enabled });

            expect(canAddService(enabledService, ['first'])).toBeTruthy();
            expect(canAddService(enabledService, ['second'])).toBeFalsy();

            const partyEnabledService = generateService({ serviceId: 'first', state: ExclusionStates.PartlyEnabled });
            expect(canAddService(partyEnabledService, ['first'])).toBeTruthy();
            expect(canAddService(partyEnabledService, ['second'])).toBeFalsy();
        });
    });
});
