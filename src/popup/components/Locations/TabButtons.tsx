import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { LocationsTab } from '../../../background/endpoints/locationsEnums';
import {
    TelemetryActionName,
    TelemetryScreenName,
    type LocationsTabClickActionNames,
} from '../../../background/telemetry/telemetryEnums';
import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';

/**
 * Locations tab button data.
 */
interface TabButtonData {
    /**
     * Tab value.
     */
    tab: LocationsTab;

    /**
     * Tab content.
     */
    title: string;

    /**
     * Telemetry action name.
     */
    telemetryActionName: LocationsTabClickActionNames;
}

/**
 * Locations tab button component props.
 */
interface TabButtonProps extends TabButtonData {
    /**
     * Is tab active.
     */
    active: boolean;

    /**
     * Click handler.
     *
     * @param tab Tab value.
     */
    onClick: (tab: LocationsTab, telemetryActionName: LocationsTabClickActionNames) => void;
}

/**
 * Locations tab button component.
 */
const TabButton = ({
    tab,
    active,
    title,
    telemetryActionName,
    onClick,
}: TabButtonProps) => {
    const classes = classNames('endpoints__tab-btn', {
        'endpoints__tab-btn--active': active,
    });

    const handleClick = () => {
        onClick(tab, telemetryActionName);
    };

    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
        >
            {title}
        </button>
    );
};

/**
 * Locations tabs switcher component.
 */
export const TabButtons = observer(() => {
    const { vpnStore, telemetryStore } = useContext(rootStore);
    const { locationsTab, saveLocationsTab } = vpnStore;

    const TAB_BUTTONS: TabButtonData[] = [
        {
            tab: LocationsTab.All,
            title: translator.getMessage('endpoints_tab_all'),
            telemetryActionName: TelemetryActionName.AllLocationsClick,
        },
        {
            tab: LocationsTab.Saved,
            title: translator.getMessage('endpoints_tab_saved'),
            telemetryActionName: TelemetryActionName.SavedLocationsClick,
        },
    ];

    const tabClickHandler = async (tab: LocationsTab, telemetryActionName: LocationsTabClickActionNames) => {
        telemetryStore.sendCustomEvent(
            telemetryActionName,
            TelemetryScreenName.LocationsScreen,
        );
        await saveLocationsTab(tab);
    };

    return (
        <div className="endpoints__tab-btns">
            {TAB_BUTTONS.map(({ tab, title, telemetryActionName }) => (
                <TabButton
                    key={tab}
                    tab={tab}
                    title={title}
                    active={locationsTab === tab}
                    telemetryActionName={telemetryActionName}
                    onClick={tabClickHandler}
                />
            ))}
        </div>
    );
});
