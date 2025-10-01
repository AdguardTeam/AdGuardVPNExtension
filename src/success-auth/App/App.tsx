import React, { type ReactElement } from 'react';

import { translator } from '../../common/translator';
import ninjaLikeImageUrl from '../../assets/images/ninja-like.svg';

import '../../options/styles/main.pcss';
import './app.pcss';

export function App(): ReactElement {
    return (
        <div className="success-auth">
            <div className="success-auth__header">
                <div className="success-auth__logo" />
            </div>
            <div className="success-auth__content">
                <img
                    src={ninjaLikeImageUrl}
                    alt="Ninja Likes"
                    className="success-auth__image"
                />
                <div className="success-auth__text">
                    <h1 className="success-auth__title">
                        {translator.getMessage('auth_success_title')}
                    </h1>
                    <p className="success-auth__description">
                        {translator.getMessage('auth_success_description')}
                    </p>
                </div>
            </div>
        </div>
    );
}
