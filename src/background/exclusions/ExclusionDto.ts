import { ExclusionDtoInterface, ExclusionState, ExclusionsTypes } from '../../common/exclusionsConstants';

export class ExclusionDto implements ExclusionDtoInterface {
    id: string;

    value: string;

    state: ExclusionState;

    type: ExclusionsTypes;

    iconUrl?: string;

    children: ExclusionDtoInterface[];

    constructor({
        id,
        value,
        state,
        type,
        children,
        iconUrl,
    }: {
        id: string,
        value: string,
        state: ExclusionState,
        type: ExclusionsTypes,
        children: ExclusionDtoInterface[],
        iconUrl?: string,
    }) {
        this.id = id;
        this.value = value;
        this.state = state;
        this.type = type;
        this.children = children;

        if (iconUrl) {
            this.iconUrl = iconUrl;
        }
    }
}
