import {
    canAddService,
} from '../../../../../../../src/options/components/Exclusions/ExclusionsModal/AddExclusionsModal/ServiceMode/ServiceRow';
import { ExclusionState, ServiceDto } from '../../../../../../../src/common/exclusionsConstants';

const generateService = (props: Partial<ServiceDto>): ServiceDto => {
    const mockedService: ServiceDto = {
        serviceId: 'string',
        serviceName: 'string',
        iconUrl: 'string',
        categories: [],
        state: ExclusionState.Enabled,
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
            const service = generateService({ serviceId: 'first', state: ExclusionState.Disabled });

            expect(canAddService(service, [])).toBeTruthy();
            expect(canAddService(service, ['first'])).toBeFalsy();
            expect(canAddService(service, ['second'])).toBeTruthy();
        });

        it('correctly decides button state for enabled or partly enabled service', () => {
            const enabledService = generateService({ serviceId: 'first', state: ExclusionState.Enabled });

            expect(canAddService(enabledService, ['first'])).toBeTruthy();
            expect(canAddService(enabledService, ['second'])).toBeFalsy();

            const partyEnabledService = generateService({ serviceId: 'first', state: ExclusionState.PartlyEnabled });
            expect(canAddService(partyEnabledService, ['first'])).toBeTruthy();
            expect(canAddService(partyEnabledService, ['second'])).toBeFalsy();
        });
    });
});
