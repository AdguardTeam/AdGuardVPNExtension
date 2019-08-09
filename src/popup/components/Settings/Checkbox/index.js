import React from 'react';
import './checkbox.pcss';

function Checkbox(props) {
    const {
        title,
        id,
        value,
        handler,
        mod,
    } = props;

    return (
        <div
            className={`checkbox ${mod || ''}`}
        >
            <input
                type="checkbox"
                name={id}
                value={value}
                onChange={(e) => { handler(e); }}
                id={id}
                className="checkbox__in"
            />
            <label
                htmlFor={id}
                className="checkbox__label"
            />
            <span className="checkbox__title">
                {title}
            </span>
        </div>
    );
}

export default Checkbox;
