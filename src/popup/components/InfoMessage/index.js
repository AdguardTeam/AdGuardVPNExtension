import React from 'react';
import './info-message.pcss';

function InfoMessage() {
    return (
        <div className="info-message">
            <div className="info-message__info">
                Your speed is limited to
                <span className="info-message__mark">
                    &nbsp;1 Mbps
                </span>
            </div>
            <a
                href="#"
                type="button"
                className="info-message__btn button button--orange"
            >
                Lift the limit
            </a>
        </div>
    );
}

export default InfoMessage;
