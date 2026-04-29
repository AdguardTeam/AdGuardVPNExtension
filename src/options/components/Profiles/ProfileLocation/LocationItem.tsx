import React from 'react';

import browser from 'webextension-polyfill';

import { Radio } from '../../ui/Radio';

import styles from './location-item.module.pcss';

interface LocationItemProps {
    id: string;
    countryName: string;
    cityName: string;
    countryCode: string;
    selected: boolean;
    onClick: (id: string) => void;
}

/**
 * Single location row with radio indicator, flag, country and city.
 */
export const LocationItem = ({
    id,
    countryName,
    cityName,
    countryCode,
    selected,
    onClick,
}: LocationItemProps): React.ReactElement => {
    const iconName = countryCode.toLowerCase();
    const flagUrl = browser.runtime.getURL(`assets/images/flags/${iconName}.svg`);

    const title = (
        <span className={styles.title}>
            <span
                className={styles.flag}
                style={{ backgroundImage: `url("${flagUrl}")` }}
            />
            {countryName}
        </span>
    );

    return (
        <Radio
            name="profile-location"
            value={id}
            isActive={selected}
            title={title}
            description={cityName}
            onSelect={onClick}
        />
    );
};
