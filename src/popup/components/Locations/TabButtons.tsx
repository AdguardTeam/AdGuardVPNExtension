import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { LocationsTab } from '../../../background/savedLocations';
import { rootStore } from '../../stores';

/**
 * Locations tab button component props.
 */
interface TabProps {
    /**
     * Tab value.
     */
    tab: LocationsTab;

    /**
     * Is tab active.
     */
    active: boolean;

    /**
     * Tab content.
     */
    children: React.ReactNode;

    /**
     * Click handler.
     *
     * @param tab Tab value.
     */
    onClick: (tab: LocationsTab) => void;
}

/**
 * Locations tab button component.
 */
const TabButton = ({
    tab,
    active,
    children,
    onClick,
}: TabProps) => {
    const classes = classNames('endpoints__tab-btn', {
        'endpoints__tab-btn--active': active,
    });

    const handleClick = () => {
        onClick(tab);
    };

    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
        >
            {children}
        </button>
    );
};

/**
 * Locations tabs switcher component.
 */
export const TabButtons = observer(() => {
    const { vpnStore } = useContext(rootStore);
    const { locationsTab, saveLocationsTab } = vpnStore;

    // FIXME: Add telemetry events
    const TAB_BUTTONS = [
        {
            tab: LocationsTab.All,
            title: 'All',
        },
        {
            tab: LocationsTab.Saved,
            title: 'Saved',
        },
    ];

    const tabClickHandler = async (tab: LocationsTab) => {
        await saveLocationsTab(tab);
    };

    return (
        <div className="endpoints__tab-btns">
            {TAB_BUTTONS.map(({ tab, title }) => (
                <TabButton
                    key={tab}
                    tab={tab}
                    active={locationsTab === tab}
                    onClick={tabClickHandler}
                >
                    {title}
                </TabButton>
            ))}
        </div>
    );
});
