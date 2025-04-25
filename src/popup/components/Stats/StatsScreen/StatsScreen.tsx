import React from 'react';

import { translator } from '../../../../common/translator';
import { type DataUsage, type StatsRange } from '../../../stores/StatsStore';
import { Icon } from '../../ui/Icon';

import { StatsScreenMenu } from './StatsScreenMenu';

import './stats-screen.pcss';

import { StatsScreenRange } from './StatsScreenRange';

/**
 * Props for the StatsScreen component.
 */
export interface StatsScreenProps {
    /**
     * Title of the stats screen.
     */
    title: string;

    /**
     * Range of the stats. Used to calculate date range
     * string and as value of select.
     */
    range: StatsRange;

    /**
     * Should 'Why it's safe' button and modal be rendered.
     */
    shouldRenderWhySafe?: boolean;

    /**
     * Data usage bytes. If not provided, data usage block will not be rendered.
     */
    dataUsage?: DataUsage;

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
    onRangeChange: (range: StatsRange) => void;
}

/**
 * StatsScreen component.
 */
export function StatsScreen(props: StatsScreenProps) {
    const {
        title,
        range,
        shouldRenderWhySafe = false,
        dataUsage,
        onBackClick,
        onClear,
        onRangeChange,
    } = props;

    // FIXME: Implement shadow when content is started scrolling
    // FIXME: Implement clear modal

    const handleClearClick = () => {
        // FIXME: Implement clear modal opening
    };

    return (
        <div className="stats-screen">
            <div className="stats-screen__header">
                <div className="stats-screen__navbar">
                    <button
                        type="button"
                        className="stats-screen__navbar-btn"
                        onClick={onBackClick}
                    >
                        <Icon
                            icon="back"
                            className="stats-screen__navbar-btn-icon"
                        />
                    </button>
                    <StatsScreenMenu
                        shouldRenderWhySafe={shouldRenderWhySafe}
                        onClear={handleClearClick}
                    />
                </div>
                <div className="stats-screen__header-content">
                    <div className="stats-screen__title">
                        {title}
                    </div>
                    <div className="stats-screen__range">
                        {/* FIXME: Implement range based dates */}
                        11 Aug 2022 – 17 Aug 2023
                    </div>
                    <StatsScreenRange
                        range={range}
                        onRangeChange={onRangeChange}
                    />
                </div>
            </div>
            <div className="stats-screen__content">
                {dataUsage && (
                    <>
                        <div className="stats-screen__subtitle">
                            {translator.getMessage('popup_stats_data_usage')}
                        </div>
                        {'TEST\n'.repeat(50) /* FIXME: Implement data usage block */}
                    </>
                )}
                <div className="stats-screen__subtitle">
                    {translator.getMessage('popup_stats_most_used_locations')}
                </div>
                {'TEST\n'.repeat(50) /* FIXME: Implement locations block */}
                <div className="stats-screen__subtitle">
                    {translator.getMessage('popup_stats_usage_time')}
                </div>
                {'TEST\n'.repeat(50) /* FIXME: Implement usage time block */}
            </div>
        </div>
    );
}
