import React from 'react';
import { observer } from 'mobx-react';

// FIXME setup linter
// @ts-ignore
import s from './service-mode.module.pcss';

// FIXME remove ts-ignore
// @ts-ignore
export const ServiceRow = observer(({ service }) => {
    return (
        <>
            <div className={s.serviceRow}>
                <div className={s.iconWrapper}>
                    <img className={s.icon} src={service.iconUrl} alt={service.serviceName} />
                </div>
                <div className="title">{service.serviceName}</div>
                <div className="action">Add/Remove</div>
            </div>
        </>
    );
});
