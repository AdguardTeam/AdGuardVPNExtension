import { notifier } from '../../common/notifier';
import { notifications } from '../notifications';
import { updateService } from '../updateService';
import { forwarder } from '../forwarder';
import { tabs } from '../tabs';
import { credentials } from '../credentials';

import { AuthSideEffects } from './AuthSideEffects';

export const authSideEffects = new AuthSideEffects({
    notifier,
    notifications,
    updateService,
    forwarder,
    tabs,
    credentials,
});
