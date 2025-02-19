import { notifier } from '../../common/notifier';
import { browserApi } from '../browserApi';
import { settings } from '../settings';

import { RateModal } from './RateModal';

export const rateModal = new RateModal({
    storage: browserApi.storage,
    settings,
    notifier,
});
