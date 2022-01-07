import { ExclusionDtoInterface, ExclusionState, ExclusionsTypes } from '../../common/exclusionsConstants';

interface ExclusionDtoProps {
    id: string;
    hostname: string;
    state: ExclusionState;
    type: ExclusionsTypes;
    children: ExclusionDtoInterface[];
    iconUrl?: string;
}

export class ExclusionDto implements ExclusionDtoInterface {
    id: string;

    hostname: string;

    state: ExclusionState;

    type: ExclusionsTypes;

    iconUrl?: string;

    children: ExclusionDtoInterface[];

    constructor({
        id,
        hostname,
        state,
        type,
        children,
        iconUrl,
    }: ExclusionDtoProps) {
        this.id = id;
        this.hostname = hostname;
        this.state = state;
        this.type = type;
        this.children = children;

        if (iconUrl) {
            this.iconUrl = iconUrl;
        }
    }
}
