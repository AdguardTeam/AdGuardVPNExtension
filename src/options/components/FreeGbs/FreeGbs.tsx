import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { NavLink } from 'react-router-dom';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';

import './free-gbs.pcss';

export const FreeGbs = observer(() => {
    const { settingsStore } = useContext(rootStore);

    // const { isPremiumToken } = settingsStore;

    return (
        <>
            <Title
                title={reactTranslator.getMessage('settings_free_gbs')}
                subtitle={reactTranslator.getMessage('settings_free_gbs_subtitle')}
            />
            <nav>
                <NavLink className="free-gbs__item" exact to="/referral-program">
                    <svg className="icon icon--button free-gbs__item--check-mark">
                        <use xlinkHref="#check-mark" />
                    </svg>
                    <div>
                        <div className="free-gbs__item--title">
                            {reactTranslator.getMessage('settings_free_gbs_invite_friend')}
                        </div>
                        <div className="free-gbs__item--description">
                            {/*{reactTranslator.getMessage('settings_free_gbs_invite_friend')}*/}
                            Get up to 5 GB
                        </div>
                    </div>
                    <svg className="icon icon--button free-gbs__item--arrow">
                        <use xlinkHref="#arrow" />
                    </svg>
                </NavLink>
                <NavLink className="free-gbs__item" exact to="/confirm-email">
                    <svg className="icon icon--button free-gbs__item--check-mark">
                        <use xlinkHref="#check-mark" />
                    </svg>
                    <div>
                        <div className="free-gbs__item--title">
                            {reactTranslator.getMessage('settings_free_gbs_confirm_email_title')}
                        </div>
                        <div className="free-gbs__item--description">
                            {/*{reactTranslator.getMessage('settings_free_gbs_invite_friend')}*/}
                            Get 1 GB
                        </div>
                    </div>
                    <svg className="icon icon--button free-gbs__item--arrow">
                        <use xlinkHref="#arrow" />
                    </svg>
                </NavLink>
                <NavLink className="free-gbs__item" exact to="/add-device">
                    <svg className="icon icon--button free-gbs__item--check-mark">
                        <use xlinkHref="#check-mark-done" />
                    </svg>
                    <div>
                        <div className="free-gbs__item--title">
                            {reactTranslator.getMessage('settings_free_gbs_add_device_title')}
                        </div>
                        <div className="free-gbs__item--description">
                            {/*{reactTranslator.getMessage('settings_free_gbs_invite_friend')}*/}
                            Get 1 GB
                        </div>
                    </div>
                    <svg className="icon icon--button free-gbs__item--arrow">
                        <use xlinkHref="#arrow" />
                    </svg>
                </NavLink>
            </nav>
        </>
    );
});
