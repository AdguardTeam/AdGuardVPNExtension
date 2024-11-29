import React, {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useLockBody } from '../../hooks/useLockBody';
import { IconButton } from '../ui/Icon';

import { Rate } from './Rate';
import { SidebarLink } from './SidebarLink';

import './sidebar.pcss';

export const Sidebar = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        isPremiumToken,
        invitesQuestCompleted,
        confirmEmailQuestCompleted,
        addDeviceQuestCompleted,
    } = settingsStore;

    const ref = useRef<HTMLDivElement>(null);
    const [isActive, setIsActive] = useState(false);

    const classes = classNames('sidebar', isActive && 'sidebar--active');
    const isMobileScreen = window.matchMedia('(max-width: 872px)').matches;
    const canTabLink = !isMobileScreen || isActive;
    const linkTabIndex = !canTabLink ? -1 : undefined;

    const handleCloseMenu = () => {
        setIsActive(false);
    };

    const handleOpenMenu = () => {
        setIsActive(true);
    };

    const handleCloseAll = () => {
        settingsStore.closeSubComponents();
        handleCloseMenu();
    };

    useFocusTrap(ref, isActive);
    useLockBody(isMobileScreen && isActive);

    useEffect(() => {
        (async () => {
            // request bonuses data on opening this screen to display actual information to user
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const allQuestsCompleted = (
        invitesQuestCompleted
        && confirmEmailQuestCompleted
        && addDeviceQuestCompleted
    );

    return (
        <div ref={ref} className={classes}>
            <div className="sidebar__overlay" onClick={handleCloseMenu} />
            <div className="sidebar__menu">
                <IconButton
                    name="sidebar-burger"
                    className="sidebar__menu-btn"
                    tabIndex={isActive ? -1 : undefined}
                    onClick={handleOpenMenu}
                />
            </div>
            <div className="sidebar__content">
                <div className="sidebar__logo">
                    <div className="logo" />
                </div>
                <nav className="sidebar__nav" onClick={handleCloseAll}>
                    <SidebarLink to="/" tabIndex={linkTabIndex}>
                        {reactTranslator.getMessage('settings_title')}
                    </SidebarLink>
                    <SidebarLink to="/exclusions" tabIndex={linkTabIndex}>
                        {reactTranslator.getMessage('settings_exclusion_title')}
                    </SidebarLink>
                    <SidebarLink to="/account" tabIndex={linkTabIndex}>
                        {reactTranslator.getMessage('account_title')}
                    </SidebarLink>
                    <SidebarLink to="/support" tabIndex={linkTabIndex}>
                        {reactTranslator.getMessage('options_support_title')}
                    </SidebarLink>
                    <SidebarLink to="/about" tabIndex={linkTabIndex}>
                        {reactTranslator.getMessage('about_title')}
                    </SidebarLink>
                    {!isPremiumToken && (
                        <SidebarLink
                            to="/free-gbs"
                            hasBullet={!allQuestsCompleted}
                            tabIndex={linkTabIndex}
                        >
                            {reactTranslator.getMessage('settings_free_gbs')}
                        </SidebarLink>
                    )}
                </nav>
                <IconButton
                    name="cross"
                    className="sidebar__menu-close-btn"
                    tabIndex={!isActive ? -1 : undefined}
                    onClick={handleCloseMenu}
                />
                <Rate />
            </div>
        </div>
    );
});
