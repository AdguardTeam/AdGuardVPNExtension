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
            <div className="sidebar__overlay" onClick={handleCloseMenu}>
                <IconButton
                    name="cross"
                    className="sidebar__menu-close-btn"
                    tabIndex={!isActive ? -1 : undefined}
                    onClick={handleCloseMenu}
                />
            </div>
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
                    <SidebarLink to="/" menuActive={isActive}>
                        {/* FIXME: Translation */}
                        General
                    </SidebarLink>
                    <SidebarLink to="/exclusions" menuActive={isActive}>
                        {reactTranslator.getMessage('settings_exclusion_title')}
                    </SidebarLink>
                    <SidebarLink to="/account" menuActive={isActive}>
                        {reactTranslator.getMessage('account_title')}
                    </SidebarLink>
                    <SidebarLink to="/support" menuActive={isActive}>
                        {reactTranslator.getMessage('options_support_title')}
                    </SidebarLink>
                    <SidebarLink to="/about" menuActive={isActive}>
                        {reactTranslator.getMessage('about_title')}
                    </SidebarLink>
                    {!isPremiumToken && (
                        <SidebarLink
                            to="/free-gbs"
                            hasBullet={!allQuestsCompleted}
                            menuActive={isActive}
                        >
                            {reactTranslator.getMessage('settings_free_gbs')}
                        </SidebarLink>
                    )}
                </nav>
                <Rate />
            </div>
        </div>
    );
});
