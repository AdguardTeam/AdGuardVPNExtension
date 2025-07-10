import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';

import { StatisticsRange, type StatisticsData } from '../../../../background/statistics/statisticsTypes';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { IconButton } from '../../../../common/components/Icons';
import { DotsLoader } from '../../../../common/components/DotsLoader';
import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
import { type LocationUsage } from '../../../stores/StatsStore';
import { getFlagIconStyle } from '../../Locations';
import { formatRange } from '../utils';

import { StatsScreenMenu } from './StatsScreenMenu';
import { StatsScreenRange } from './StatsScreenRange';
import { StatsScreenData } from './StatsScreenData';
import { StatsScreenLocations } from './StatsScreenLocations';
import { StatsScreenTime } from './StatsScreenTime';

import './stats-screen.pcss';

/**
 * Base props that are common to all stats screen types.
 */
export interface StatsScreenBaseProps {
    /**
     * Title of the stats screen.
     */
    title: string;

    /**
     * Range of the stats.
     * Used to calculate date range string and as value of select.
     */
    range: StatisticsRange;

    /**
     * Date when the stats collection started.
     */
    firstStatsDate: Date;

    /**
     * Whether the stats screen is currently loading or not
     */
    isLoading: boolean;

    /**
     * Whether the stats collection is disabled or not.
     */
    isDisabled: boolean;

    /**
     * Callback function to be called when the back button is clicked.
     */
    onBackClick: () => void;

    /**
     * Callback function to be called when the clear button is clicked.
     */
    onClear: () => void;

    /**
     * Callback function to be called when the range is changed.
     *
     * @param range New range value of range
     */
    onRangeChange: (range: StatisticsRange) => void;

    /**
     * Callback function to be called when the disable state is changed.
     *
     * @param isDisabled New disable state of the stats collection.
     */
    onDisableChange: (isDisabled: boolean) => void;
}

/**
 * Props for the stats screen that shows data usage and time usage.
 */
export interface StatsScreenWithUsageProps {
    /**
     * Data and duration usage.
     */
    usage: StatisticsData;
}

/**
 * Props for the stats screen that shows locations data usage.
 */
export interface StatsScreenWithLocationsProps {
    /**
     * Locations data usage.
     */
    locations: LocationUsage[];

    /**
     * Callback function to be called when the location is clicked.
     *
     * @param locationId ID of the location that was clicked.
     */
    onLocationClick: (locationId: string) => void;

    /**
     * Callback function to be called when the 'View all locations' button is clicked.
     */
    onAllLocationsClick: () => void;
}

/**
 * Location type stats screen props for the {@link StatsScreen} component.
 */
export interface StatsScreenLocationProps extends StatsScreenBaseProps, StatsScreenWithUsageProps {
    /**
     * Stats screen type.
     */
    type: 'location';

    /**
     * Country code of the location. Used to show country flag.
     */
    countryCode: string;
}

/**
 * All locations type stats screen props for the {@link StatsScreen} component.
 */
export interface StatsScreenAllLocationsProps extends StatsScreenBaseProps, StatsScreenWithLocationsProps {
    /**
     * Stats screen type.
     */
    type: 'all-locations';
}

/**
 * Main type stats screen props for the {@link StatsScreen} component.
 */
// eslint-disable-next-line max-len
export interface StatsScreenMainProps extends StatsScreenBaseProps, StatsScreenWithUsageProps, StatsScreenWithLocationsProps {
    /**
     * Stats screen type.
     */
    type: 'main';
}

/**
 * Props for the {@link StatsScreen} component.
 */
export type StatsScreenProps = StatsScreenLocationProps | StatsScreenAllLocationsProps | StatsScreenMainProps;

/**
 * Component that renders the stats screen.
 */
export const StatsScreen = observer((props: StatsScreenProps) => {
    const {
        type,
        title,
        range,
        firstStatsDate,
        isLoading,
        isDisabled,
        onBackClick,
        onClear,
        onRangeChange,
        onDisableChange,
    } = props;

    const { telemetryStore } = useContext(rootStore);

    const headerRef = useRef<HTMLDivElement>(null);
    const contentWrapperRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const applyFadeIfScrollable = () => {
        const contentWrapper = contentWrapperRef.current;
        const content = contentRef.current;
        if (!contentWrapper || !content) {
            return;
        }

        const CONTENT_FADE_ACTIVE_CLASS = 'stats-screen__content-wrapper--fade-active';

        // Pixel buffer needs for cases floating pixel size (e.g. 405.5px)
        const pixelBuffer = 1;
        const { scrollTop, clientHeight, scrollHeight } = content;
        const canScrollBottom = scrollTop + clientHeight + pixelBuffer < scrollHeight;

        if (canScrollBottom) {
            contentWrapper.classList.add(CONTENT_FADE_ACTIVE_CLASS);
        } else {
            contentWrapper.classList.remove(CONTENT_FADE_ACTIVE_CLASS);
        }
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const header = headerRef.current;
        if (!header) {
            return;
        }

        const HEADER_WITH_SHADOW_CLASS = 'stats-screen__header--with-shadow';
        const content = event.target as HTMLDivElement;

        // If user scrolled down, add shadow to header
        if (content.scrollTop > 0) {
            header.classList.add(HEADER_WITH_SHADOW_CLASS);
        } else {
            header.classList.remove(HEADER_WITH_SHADOW_CLASS);
        }

        applyFadeIfScrollable();
    };

    const handleEnableClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.EnableStatsClick,
            TelemetryScreenName.ContextBasedScreen,
        );
        onDisableChange(false);
    };

    const renderRange = () => {
        const { start, end } = formatRange(range, firstStatsDate);

        // for 24 hours we should render in two lines, because it includes time
        if (range === StatisticsRange.Hours24) {
            return (
                <>
                    {`${start} –`}
                    <br />
                    {end}
                </>
            );
        }

        return `${start} – ${end}`;
    };

    // apply fade if content scrollable on first render
    useEffect(applyFadeIfScrollable, []);

    const isMainScreen = type === 'main';
    const isLocationScreen = type === 'location';
    const isAllLocationsScreen = type === 'all-locations';

    let flagNode: React.ReactNode;
    if (isLocationScreen) {
        const { countryCode } = props;

        flagNode = (
            <div
                className="stats-screen__flag"
                style={getFlagIconStyle(countryCode)}
            />
        );
    }

    let dataUsageNode: React.ReactNode;
    let timeUsageNode: React.ReactNode;
    if (isMainScreen || isLocationScreen) {
        const { usage } = props;

        dataUsageNode = <StatsScreenData usage={usage} />;
        timeUsageNode = <StatsScreenTime usage={usage} />;
    }

    let locationsNode: React.ReactNode;
    if (isMainScreen || isAllLocationsScreen) {
        const { locations, onLocationClick, onAllLocationsClick } = props;

        locationsNode = (
            <StatsScreenLocations
                isMainScreen={isMainScreen}
                locations={locations}
                onAllLocationsClick={onAllLocationsClick}
                onLocationClick={onLocationClick}
            />
        );
    }

    return (
        <div className="stats-screen">
            <div ref={headerRef} className="stats-screen__header">
                <div className="stats-screen__navbar">
                    <IconButton
                        name="back"
                        className="stats-screen__navbar-btn"
                        onClick={onBackClick}
                    />
                    {isMainScreen && (
                        <StatsScreenMenu
                            isDisabled={isDisabled}
                            onDisableChange={onDisableChange}
                            onClear={onClear}
                        />
                    )}
                </div>
                <div className="stats-screen__header-content">
                    {flagNode}
                    <div className="stats-screen__title">
                        {title}
                    </div>
                    <div className="stats-screen__range">
                        {renderRange()}
                    </div>
                    {isDisabled && (
                        <div className="stats-screen__disabled-notice">
                            {translator.getMessage('popup_stats_disabled_notice')}
                        </div>
                    )}
                    <StatsScreenRange
                        range={range}
                        onRangeChange={onRangeChange}
                    />
                </div>
            </div>
            <div ref={contentWrapperRef} className="stats-screen__content-wrapper">
                <div ref={contentRef} className="stats-screen__content" onScroll={handleScroll}>
                    {isLoading ? (
                        <div className="stats-screen__loader">
                            <DotsLoader />
                        </div>
                    ) : (
                        <>
                            {dataUsageNode}
                            {locationsNode}
                            {timeUsageNode}
                        </>
                    )}
                </div>
            </div>
            {isDisabled && (
                <div className="stats-screen__footer">
                    <button
                        type="button"
                        onClick={handleEnableClick}
                        className="stats-screen-btn stats-screen-btn--primary"
                    >
                        {translator.getMessage('popup_stats_enable_btn')}
                    </button>
                </div>
            )}
        </div>
    );
});
