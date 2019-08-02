import React from 'react';
import './alert.pcss';

function Alert() {
    return (
        <div className="alert">
            <div className="alert__info">
                Your speed is limited to
                <span className="alert__mark">
                    &nbsp;1 Mbps
                </span>
            </div>
            <a
                href="#"
                type="button"
                className="alert__btn button button--orange"
            >
                Lift the limit
            </a>
        </div>
    );
}

export default Alert;
