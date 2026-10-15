import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

const mockAddToServicesToToggle = vi.hoisted(() => vi.fn());
const mockSendCustomEvent = vi.hoisted(() => vi.fn());

vi.mock('../../../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../../../src/common/components/SearchHighlighter', () => ({
    SearchHighlighter: ({ value }: { value: string }) => <span>{value}</span>,
}));

vi.mock('../../../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        exclusionsStore: {
            servicesToToggle: [],
            servicesSearchValue: '',
            addToServicesToToggle: mockAddToServicesToToggle,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import {
    ServiceRow,
} from '../../../../../../../src/options/components/Exclusions/ExclusionsModal/AddExclusionsModal/ServiceMode/ServiceRow';
// eslint-disable-next-line import/first
import { ExclusionState, type ServiceDto } from '../../../../../../../src/common/exclusionsConstants';

const service: ServiceDto = {
    serviceId: 'service-1',
    serviceName: 'Example',
    iconUrl: 'icon.png',
    categories: [],
    state: ExclusionState.Disabled,
    domains: [],
};

describe('ServiceRow telemetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should send the add website from list telemetry when the service is added', () => {
        const { container } = render(<ServiceRow service={service} />);

        fireEvent.click(container.querySelector('button')!);

        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'add_website_from_list',
            'dialog_add_website_exclusion',
        );
        expect(mockAddToServicesToToggle).toHaveBeenCalledWith('service-1');
    });
});
