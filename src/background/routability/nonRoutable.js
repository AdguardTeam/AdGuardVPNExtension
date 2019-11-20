import NonRoutableService from './NonRoutableService';
import storage from '../storage';

const nonRoutableService = new NonRoutableService(storage);

const nonRoutable = {
    isUrlRoutable: nonRoutableService.isUrlRoutable.bind(nonRoutableService),
    init: nonRoutableService.init.bind(nonRoutableService),
    getNonRoutableList: nonRoutableService.getNonRoutableList.bind(nonRoutableService),
};

export default nonRoutable;
