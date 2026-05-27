import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { translator } from '../../../../common/translator';
import { ONE_SECOND_MS } from '../../../../common/constants';
import { Icon, IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';

import styles from './profile-toast.module.pcss';

/**
 * Number of seconds the toast stays visible before auto-dismissing.
 */
const AUTO_DISMISS_SECONDS = 5;

/**
 * How long the toast stays visible before auto-dismissing, in milliseconds.
 */
const AUTO_DISMISS_MS = AUTO_DISMISS_SECONDS * ONE_SECOND_MS;

/**
 * Toast notification for profile switch result in the popup.
 */
export const ProfileToast = observer(() => {
    const { vpnStore } = useContext(rootStore);
    const { profileSwitchNotification } = vpnStore;

    const [isClosing, setIsClosing] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const dismiss = useCallback((): void => {
        setIsClosing(true);
    }, []);

    /**
     * Handles the close animation end.
     * Clears the profile switch notification after the CSS animation completes,
     * keeping the animation duration in a single source of truth (CSS).
     */
    const handleAnimationEnd = useCallback((): void => {
        if (isClosing) {
            vpnStore.clearProfileSwitchNotification();
        }
    }, [isClosing, vpnStore]);

    useEffect(() => {
        return (): void => {
            vpnStore.clearProfileSwitchNotification();
        };
    }, [vpnStore]);

    useEffect(() => {
        if (profileSwitchNotification === 0) {
            return undefined;
        }

        setIsClosing(false);

        const el = rootRef.current;
        if (el) {
            el.style.animation = 'none';
            // Force reflow to restart the animation
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            el.offsetHeight;
            el.style.animation = '';
        }

        // Restart auto-dismiss timer
        const autoDismissTimer = setTimeout(dismiss, AUTO_DISMISS_MS);

        return (): void => {
            clearTimeout(autoDismissTimer);
        };
    }, [profileSwitchNotification, dismiss]);

    if (profileSwitchNotification === 0) {
        return null;
    }

    return (
        <div
            ref={rootRef}
            className={cn(styles.root, isClosing && styles.rootClosed)}
            role="status"
            onAnimationEnd={handleAnimationEnd}
        >
            <Icon
                name="info"
                className={styles.error}
            />
            <span className={styles.message}>{translator.getMessage('profile_apply_error')}</span>
            <IconButton name="cross" onClick={dismiss} />
        </div>
    );
});
