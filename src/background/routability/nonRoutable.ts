import NonRoutableService from './NonRoutableService';
import { browserApi } from '../browserApi';

const nonRoutableService = new NonRoutableService(browserApi.storage);

export const nonRoutable = {
    isUrlRoutable: nonRoutableService.isUrlRoutable.bind(nonRoutableService),
    init: nonRoutableService.init.bind(nonRoutableService),
    getNonRoutableList: nonRoutableService.getNonRoutableList.bind(nonRoutableService),
};
