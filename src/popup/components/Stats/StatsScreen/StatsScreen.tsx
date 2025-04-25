import React, { useRef } from 'react';

import { translator } from '../../../../common/translator';
import { type DataUsage, type StatsRange } from '../../../stores/StatsStore';
import { Icon } from '../../ui/Icon';

import { StatsScreenMenu } from './StatsScreenMenu';
import { StatsScreenRange } from './StatsScreenRange';

import './stats-screen.pcss';

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
     * Do not forget to provide privacy policy URL if this field is true.
     */
    shouldRenderWhySafe?: boolean;

    /**
     * Privacy policy URL. This field is mandatory if
     * `shouldRenderWhySafe` is true.
     */
    privacyPolicyUrl?: string;

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
        privacyPolicyUrl,
        dataUsage,
        onBackClick,
        onClear,
        onRangeChange,
    } = props;

    const headerRef = useRef<HTMLDivElement>(null);

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
    };

    return (
        <div className="stats-screen">
            <div ref={headerRef} className="stats-screen__header">
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
                        privacyPolicyUrl={privacyPolicyUrl}
                        onClear={onClear}
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
            <div className="stats-screen__content" onScroll={handleScroll}>
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
