import React, { Component, Fragment } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import settingsStore from '../../stores/settingsStore';
import uiStore from '../../stores/uiStore';
import './endpoints.pcss';

@observer
class Endpoints extends Component {
    async componentDidMount() {
        await settingsStore.getEndpoints();
    }

    handleEndpointSelect = id => (e) => {
        e.preventDefault();
        settingsStore.setSelectedEndpoint(id);
    };

    handleCloseEndpoints = () => {
        uiStore.closeEndpointsSearch();
        settingsStore.setSearchValue('');
    };

    renderEndpoints = endpoints => endpoints.map((endpoint) => {
        const { cityName, activated, id } = endpoint;
        const endpointClassNames = classnames({
            endpoint: true,
            endpoint__selected: activated,
        });
        return (
            <div
                key={id}
                className={endpointClassNames}
                onClick={this.handleEndpointSelect(id)}
            >
                <i className="icon_selected" />
                <div className="endpoint-city">
                    {cityName}
                </div>
            </div>
        );
    });

    handleSearchInput = (e) => {
        const { value } = e.target;
        settingsStore.setSearchValue(value);
    };

    render() {
        const endpoints = settingsStore.filteredEndpoints;
        return (
            <Fragment>
                <div onClick={this.handleCloseEndpoints}>Close</div>
                <div className="search">
                    <input
                        type="text"
                        onChange={this.handleSearchInput}
                    />
                </div>
                <div className="endpoints">{this.renderEndpoints(endpoints)}</div>
            </Fragment>
        );
    }
}

export default Endpoints;
