import React from 'react';
import './global-switcher.pcss';

function GlobalSwitcher(props) {
    const { handle, checked } = props;
    return (
        <div className="global-switcher">
            <input
                className="global-switcher__checkbox"
                type="checkbox"
                onChange={handle}
                checked={checked}
                id="global-switcher"
            />
            <label
                className="global-switcher__label"
                htmlFor="global-switcher"
            />
        </div>
    );
}

export default GlobalSwitcher;
