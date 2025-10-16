import { notifier } from '../../common/notifier';
import { notifications } from '../notifications';
import { updateService } from '../updateService';
import { forwarder } from '../forwarder';
import { tabs } from '../tabs';
import { endpoints } from '../endpoints';

import { AuthSideEffects } from './AuthSideEffects';

export const authSideEffects = new AuthSideEffects({
    notifier,
    notifications,
    updateService,
    forwarder,
    tabs,
    endpoints,
});
