import PopupData from './PopupData';
import nonRoutable from '../routability/nonRoutable';
import permissionsError from '../permissionsChecker/permissionsError';
import endpoints from '../endpoints';
import permissionsChecker from '../permissionsChecker';

const popupData = new PopupData({
    endpoints,
    nonRoutable,
    permissionsChecker,
    permissionsError,
});

export default popupData;
