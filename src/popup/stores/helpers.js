import React from 'react';
import { MobXProviderContext, useObserver } from 'mobx-react';

function inject(selector, baseComponent) {
    const component = (ownProps) => {
        const store = React.useContext(MobXProviderContext);
        return useObserver(() => baseComponent(selector({ store, ownProps })));
    };
    component.displayName = baseComponent.name;
    return component;
}

// eslint-disable-next-line import/prefer-default-export
export { inject };
