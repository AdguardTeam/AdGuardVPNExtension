import React from 'react';
import classnames from 'classnames';

import './switch.pcss';

interface SwitchProps {
    title: string | React.ReactNode;
    desc?: string | React.ReactNode;
    checked: boolean;
    handleToggle: any;
}

export const Switch = ({
    title,
    desc,
    checked,
    handleToggle,
}: SwitchProps) => {
    const togglerClass = classnames('switch__toggler', {
        'switch__toggler--active': checked,
    });

    return (
        <div className="switch">
            <div className="switch__info">
                <div className="switch__title">
                    {title}
                </div>
                {desc && (
                    <div className="switch__desc">
                        {desc}
                    </div>
                )}
            </div>
            <div
                className={togglerClass}
                onClick={handleToggle}
            />
        </div>
    );
};
