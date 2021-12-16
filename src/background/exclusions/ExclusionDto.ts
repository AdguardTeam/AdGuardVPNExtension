import { ExclusionDtoInterface, ExclusionStates, ExclusionsTypes } from '../../common/exclusionsConstants';
import { servicesManager } from './services/ServicesManager';

export class ExclusionDto implements ExclusionDtoInterface {
    id: string;

    value: string;

    state: ExclusionStates;

    type: ExclusionsTypes;

    iconUrl?: string;

    children: ExclusionDtoInterface[];

    constructor({
        id,
        value,
        state,
        type,
        children,
    }: {
        id: string,
        value: string,
        state: ExclusionStates,
        type: ExclusionsTypes,
        children: ExclusionDtoInterface[], }) {
        this.id = id;
        this.value = value;
        this.state = state;
        this.type = type;
        this.children = children;

        const service = servicesManager.getService(id);
        if (service) {
            this.iconUrl = service.iconUrl;
        }
    }
}
