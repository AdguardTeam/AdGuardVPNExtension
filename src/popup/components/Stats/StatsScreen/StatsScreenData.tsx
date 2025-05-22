import React from 'react';

import { translator } from '../../../../common/translator';
import { MEGABYTE_BYTES, formatTraffic } from '../utils';

import { type StatsScreenWithUsageProps } from './StatsScreen';

/**
 * Props for the {@link StatsScreenData} component.
 */
export type StatsScreenDataProps = Pick<StatsScreenWithUsageProps, 'dataUsage'>;

/**
 * Component that renders the data usage block (chart) in the stats screen.
 */
export function StatsScreenData(props: StatsScreenDataProps) {
    const { dataUsage } = props;
    const { downloaded, uploaded } = dataUsage;

    const downloadText = formatTraffic(downloaded);
    const uploadText = formatTraffic(uploaded);

    // If both download and upload are <1MB then we consider it empty
    const isEmpty = downloaded < MEGABYTE_BYTES && uploaded < MEGABYTE_BYTES;

    const totalBytes = downloaded + uploaded;

    const getLineWidth = (bytes: number) => {
        const percent = Math.round((bytes / totalBytes) * 100);

        // 4px is to create 8px total gap between lines
        return `calc(${percent}% - 4px)`;
    };

    return (
        <>
            <div className="stats-screen__subtitle">
                {translator.getMessage('popup_stats_data_usage')}
            </div>
            <div className="stats-screen-data">
                <div className="stats-screen-data__info">
                    <div className="stats-screen-data__info-block stats-screen-data__info-block--download">
                        <div className="stats-screen-data__info-block-title" title={downloadText}>
                            {downloadText}
                        </div>
                        <div className="stats-screen-data__info-block-desc">
                            {translator.getMessage('popup_stats_data_usage_downloaded')}
                        </div>
                    </div>
                    <div className="stats-screen-data__info-block stats-screen-data__info-block--upload">
                        <div className="stats-screen-data__info-block-title" title={uploadText}>
                            {uploadText}
                        </div>
                        <div className="stats-screen-data__info-block-desc">
                            {translator.getMessage('popup_stats_data_usage_uploaded')}
                        </div>
                    </div>
                </div>
                <div className="stats-screen-data__chart">
                    {isEmpty ? (
                        <div className="stats-screen-data__chart-line stats-screen-data__chart-line--empty" />
                    ) : (
                        <>
                            <div
                                className="stats-screen-data__chart-line stats-screen-data__chart-line--download"
                                style={{ width: getLineWidth(downloaded) }}
                            />
                            <div
                                className="stats-screen-data__chart-line stats-screen-data__chart-line--upload"
                                style={{ width: getLineWidth(uploaded) }}
                            />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
