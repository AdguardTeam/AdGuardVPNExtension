import PopupData from './PopupData';
import nonRoutable from '../routability/nonRoutable';
import permissionsError from '../permissionsChecker/permissionsError';
import { endpoints } from '../endpoints';
import permissionsChecker from '../permissionsChecker';
import credentials from '../credentials';

const popupData = new PopupData({
    endpoints,
    nonRoutable,
    permissionsChecker,
    permissionsError,
    credentials,
});

export default popupData;
