import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { translator } from '../../../../common/translator';
import { Icon } from '../../../../common/components/Icons';
import { type LocationUsage } from '../../../stores/StatsStore';
import { rootStore } from '../../../stores';
import { getFlagIconStyle } from '../../Locations';
import { formatTraffic } from '../utils';

import { type StatsScreenWithLocationsProps } from './StatsScreen';

/**
 * Props for the {@link StatsScreenLocation} component.
 */
interface StatsScreenLocationProps extends Pick<StatsScreenWithLocationsProps, 'onLocationClick'> {
    /**
     * Location data usage.
     */
    locationUsage: LocationUsage;
}

/**
 * Component for rendering a single location in the stats screen.
 */
function StatsScreenLocation(props: StatsScreenLocationProps) {
    const { locationUsage, onLocationClick } = props;
    const { location, usage } = locationUsage;
    const { downloadedBytes, uploadedBytes } = usage;

    const title = `${location.countryName} (${location.cityName})`;
    const downloadText = formatTraffic(downloadedBytes, true, true);
    const uploadText = formatTraffic(uploadedBytes, true, false);

    const handleClick = () => {
        onLocationClick(location.id);
    };

    return (
        <button
            type="button"
            className="stats-screen-location stats-screen-locations__button"
            onClick={handleClick}
        >
            <span className="stats-screen-location__content stats-screen-locations__button-content">
                <span
                    className="stats-screen-location__flag"
                    style={getFlagIconStyle(location.countryCode)}
                />
                <span className="stats-screen-location__text">
                    <span className="stats-screen-locations__button-title">
                        {title}
                    </span>
                    <span className="stats-screen-location__desc">
                        <span className="stats-screen-location__desc-part stats-screen-location__desc-part--download">
                            {downloadText}
                        </span>
                        <span className="stats-screen-location__desc-part stats-screen-location__desc-part--upload">
                            {uploadText}
                        </span>
                    </span>
                </span>
            </span>
            <Icon
                name="arrow-down"
                color="gray"
                rotation="clockwise"
            />
        </button>
    );
}

/**
 * Props for the {@link StatsScreenLocations} component.
 */
export interface StatsScreenLocationsProps extends StatsScreenWithLocationsProps {
    /**
     * Flag indicating if the menu is on the main screen.
     * If true:
     * - Locations will be limited to 3.
     * - The 'View all locations' button will be shown if there are more than 3 locations.
     * - The subtitle will be shown.
     */
    isMainScreen: boolean;
}

/**
 * Component for rendering locations block in the stats screen.
 */
export const StatsScreenLocations = observer((props: StatsScreenLocationsProps) => {
    const {
        isMainScreen,
        locations,
        onAllLocationsClick,
        onLocationClick,
    } = props;
    const { telemetryStore } = useContext(rootStore);

    const handleAllLocationsClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.StatsAllLocationsClick,
            TelemetryScreenName.ContextBasedScreen,
        );
        onAllLocationsClick();
    };

    const locationsToRender = isMainScreen ? locations.slice(0, 3) : locations;
    const shouldRenderAllLocationsButton = isMainScreen && locations.length > 3;

    // Do not render subtitle if it's not the main screen
    const subtitleNode = isMainScreen && (
        <div className="stats-screen__subtitle">
            {translator.getMessage('popup_stats_most_used_locations')}
        </div>
    );

    if (locationsToRender.length === 0) {
        return (
            <>
                {subtitleNode}
                <div className="stats-screen-locations__empty">
                    {translator.getMessage('popup_stats_empty')}
                </div>
            </>
        );
    }

    return (
        <>
            {subtitleNode}
            <div className="stats-screen-locations">
                {locationsToRender.map((locationUsage) => (
                    <StatsScreenLocation
                        key={locationUsage.location.id}
                        locationUsage={locationUsage}
                        onLocationClick={onLocationClick}
                    />
                ))}
                {shouldRenderAllLocationsButton && (
                    <button
                        type="button"
                        className="stats-screen-locations__button"
                        onClick={handleAllLocationsClick}
                    >
                        <span className="stats-screen-locations__button-content">
                            <span className="stats-screen-locations__button-title">
                                {translator.getMessage('popup_stats_view_all_locations')}
                            </span>
                        </span>
                        <Icon
                            name="arrow-down"
                            color="gray"
                            rotation="clockwise"
                        />
                    </button>
                )}
            </div>
        </>
    );
});
