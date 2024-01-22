import { browserApi } from '../browserApi';

import { NonRoutableService } from './NonRoutableService';

const nonRoutableService = new NonRoutableService(browserApi.storage);

export const nonRoutable = {
    isUrlRoutable: nonRoutableService.isUrlRoutable.bind(nonRoutableService),
    init: nonRoutableService.init.bind(nonRoutableService),
    getNonRoutableList: nonRoutableService.getNonRoutableList.bind(nonRoutableService),
};
