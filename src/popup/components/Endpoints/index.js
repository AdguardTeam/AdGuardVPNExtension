import React, { Component } from 'react';
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
            'endpoints__item--selected': activated,
        });
        return (
            <div
                key={id}
                className={`endpoints__item ${endpointClassNames}`}
                onClick={this.handleEndpointSelect(id)}
            >
                <div className="endpoints__item-ico" />
                <div className="endpoints__city">
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
            <div className="endpoints">
                <div className="endpoints__header">
                    <button
                        type="button"
                        className="button endpoints__back"
                        onClick={this.handleCloseEndpoints}
                    />
                    <div className="endpoints__search">
                        <input
                            className="endpoints__search-in"
                            type="text"
                            onChange={this.handleSearchInput}
                        />
                        <button
                            type="button"
                            className="button endpoints__cross"
                        />
                    </div>
                </div>
                <div className="endpoints__list">
                    {this.renderEndpoints(endpoints)}
                </div>
            </div>
        );
    }
}

export default Endpoints;
