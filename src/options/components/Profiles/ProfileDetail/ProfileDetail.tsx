import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { translator } from 'common/translator';

import { isDefaultProfileId } from '../../../../common/profilesConstants';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { ProfileActions } from '../ProfileActions';

import styles from './profile-detail.module.pcss';

/**
 * Profile detail page showing settings for a single profile.
 * Currently a placeholder — real settings will be added later.
 */
export const ProfileDetail = observer(() => {
    const { profilesStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const profile = profilesStore.profiles.find((p) => p.id === id);

    const handleBack = (): void => {
        history.push('/profiles');
    };

    if (!profile) {
        return <Redirect to="/profiles" />;
    }

    const displayName = profilesStore.getDisplayName(profile);

    const isDefault = isDefaultProfileId(profile.id);
    const isActive = profilesStore.isActive(profile.id);

    const handleStopPropagation = (e: React.SyntheticEvent): void => {
        e.stopPropagation();
    };

    return (
        <div className={styles.root}>
            <Title
                title={displayName}
                action={(
                    <div
                        role="toolbar"
                        aria-label={translator.getMessage('settings_profiles_actions')}
                        onClick={handleStopPropagation}
                        onKeyDown={handleStopPropagation}
                    >
                        <ProfileActions isDefault={isDefault} isActive={isActive} />
                    </div>
                )}
                onClick={handleBack}
            />
            <div className={styles.placeholder}>
                {/* eslint-disable-next-line max-len */}
                {/* FIXME: Replace this placeholder with real profile settings (Location, Block WebRTC, DNS server, Exclusions) */}
                <svg
                    className={styles.placeholderSvg}
                    viewBox="0 0 300 160"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        {/* Elliptical path around the text for the cat to run on */}
                        <path
                            id="catPath"
                            d="M150,80 m-120,0 a120,50 0 1,1 240,0 a120,50 0 1,1 -240,0"
                            fill="none"
                        />
                    </defs>

                    <text
                        x="150"
                        y="78"
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="600"
                        fill="var(--stroke-icons-gray-icons-default)"
                        opacity="0.25"
                    >
                        Coming soon
                    </text>

                    {/* Floating question marks */}
                    <text fontSize="14" fill="var(--stroke-icons-gray-icons-default)" opacity="0.3">
                        <animateMotion dur="8s" repeatCount="indefinite" path="M60,50 Q50,20 70,40 Q80,60 60,50" />
                        ?
                    </text>
                    <text fontSize="11" fill="var(--stroke-icons-gray-icons-default)" opacity="0.2">
                        <animateMotion dur="6s" repeatCount="indefinite" path="M220,40 Q240,20 230,50 Q210,60 220,40" />
                        ?
                    </text>
                    <text fontSize="16" fill="var(--stroke-icons-gray-icons-default)" opacity="0.2">
                        <animateMotion dur="10s" repeatCount="indefinite" path="M140,30 Q160,10 150,40 Q130,50 140,30" />
                        ?
                    </text>

                    {/* Cat running around the text */}
                    <g>
                        <animateMotion
                            dur="6s"
                            repeatCount="indefinite"
                            rotate="auto"
                        >
                            <mpath href="#catPath" />
                        </animateMotion>

                        {/* Body */}
                        <ellipse cx="0" cy="0" rx="14" ry="9" fill="var(--stroke-icons-gray-icons-default)" opacity="0.5" />
                        {/* Head */}
                        <circle cx="16" cy="-4" r="8" fill="var(--stroke-icons-gray-icons-default)" opacity="0.5" />
                        {/* Left ear */}
                        <polygon points="11,-10 13,-18 17,-10" fill="var(--stroke-icons-gray-icons-default)" opacity="0.5" />
                        {/* Right ear */}
                        <polygon points="17,-10 20,-18 23,-10" fill="var(--stroke-icons-gray-icons-default)" opacity="0.5" />
                        {/* Eyes */}
                        <circle cx="14" cy="-5" r="1.5" fill="var(--stroke-icons-product-icon-default)" opacity="0.8" />
                        <circle cx="20" cy="-5" r="1.5" fill="var(--stroke-icons-product-icon-default)" opacity="0.8" />
                        {/* Nose */}
                        <circle cx="17" cy="-2" r="0.8" fill="var(--stroke-icons-gray-icons-default)" opacity="0.7" />
                        {/* Tail */}
                        <path d="M-14,0 Q-22,-12 -18,-20" stroke="var(--stroke-icons-gray-icons-default)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5">
                            <animate attributeName="d" values="M-14,0 Q-22,-12 -18,-20;M-14,0 Q-24,-8 -20,-18;M-14,0 Q-22,-12 -18,-20" dur="0.4s" repeatCount="indefinite" />
                        </path>
                        {/* Front legs running */}
                        <line x1="8" y1="8" x2="6" y2="16" stroke="var(--stroke-icons-gray-icons-default)" strokeWidth="2" strokeLinecap="round" opacity="0.5">
                            <animate attributeName="x2" values="4;10;4" dur="0.3s" repeatCount="indefinite" />
                        </line>
                        <line x1="12" y1="8" x2="14" y2="16" stroke="var(--stroke-icons-gray-icons-default)" strokeWidth="2" strokeLinecap="round" opacity="0.5">
                            <animate attributeName="x2" values="16;10;16" dur="0.3s" repeatCount="indefinite" />
                        </line>
                        {/* Back legs running */}
                        <line x1="-8" y1="8" x2="-10" y2="16" stroke="var(--stroke-icons-gray-icons-default)" strokeWidth="2" strokeLinecap="round" opacity="0.5">
                            <animate attributeName="x2" values="-12;-6;-12" dur="0.3s" repeatCount="indefinite" begin="0.15s" />
                        </line>
                        <line x1="-4" y1="8" x2="-2" y2="16" stroke="var(--stroke-icons-gray-icons-default)" strokeWidth="2" strokeLinecap="round" opacity="0.5">
                            <animate attributeName="x2" values="0;-6;0" dur="0.3s" repeatCount="indefinite" begin="0.15s" />
                        </line>
                        {/* Magnifying glass held in front */}
                        <g opacity="0.6">
                            <circle cx="26" cy="0" r="5" fill="none" stroke="var(--stroke-icons-gray-icons-default)" strokeWidth="1.5" />
                            <line x1="30" y1="4" x2="34" y2="8" stroke="var(--stroke-icons-gray-icons-default)" strokeWidth="1.5" strokeLinecap="round" />
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
});
