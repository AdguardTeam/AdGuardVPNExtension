import React from 'react';
import { observer } from 'mobx-react';

import './select.pcss';

@observer
class Select extends React.Component {
    componentDidMount() {
        this.updateSelectorData();
    }

    componentDidUpdate() {
        this.updateSelectorData();
    }

    /**
     * Updates select to actual data
     */
    updateSelectorData = () => {
        const selector = document.querySelector('.selector__value');
        const value = selector.getAttribute('value');
        this.copyData(
            document.querySelector(`.selector__options-list > [value=${value}]`),
            selector
        );
    };

    handleSelectClick = () => {
        const optionsList = document.querySelector('.selector__options-list');
        if (!optionsList.style.display || optionsList.style.display === 'none') {
            optionsList.style.display = 'block';
            document.addEventListener(
                'click',
                () => { optionsList.style.display = 'none'; },
                { once: true }
            );
        }
    };

    handleOptionClick = (id) => {
        this.copyData(
            document.querySelector(`.selector__options-list > [value=${id}]`),
            document.querySelector('.selector__value')
        );
        const { optionChange } = this.props;
        optionChange(id);
    };

    /**
     * Copy innerHTML and value from source element to target
     * @param {object} source
     * @param {object} target
     */
    copyData = (source, target) => {
        if (source && target) {
            // eslint-disable-next-line no-param-reassign
            target.innerHTML = source.innerHTML;

            const sourceValue = source.getAttribute('value');
            // eslint-disable-next-line no-param-reassign
            target.setAttribute('value', sourceValue);
        }
    };

    render() {
        const {
            id,
            disabled,
            options,
            currentValue,
        } = this.props;
        return (
            <div
                id={id}
                className="selector"
                disabled={disabled}
            >
                <div
                    className="selector__value"
                    value={currentValue}
                    onClick={this.handleSelectClick}
                />
                <ul className="selector__options-list">
                    {options.map((option, i) => (
                        <li
                            value={option.id}
                            // eslint-disable-next-line react/no-array-index-key
                            key={i}
                            className="selector__option-item"
                            onClick={() => this.handleOptionClick(option.id)}
                        >
                            <div className="selector__option-item__title">{option.title}</div>
                            <div className="selector__option-item__desc">{option.desc}</div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}

export default Select;
