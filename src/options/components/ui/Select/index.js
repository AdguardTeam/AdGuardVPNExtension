import React from 'react';
import PropTypes from 'prop-types';

import './select.pcss';

export default class Select extends React.Component {
    componentDidMount() {
        this.copyInnerHTML(
            document.querySelector('.selector__options-list').firstElementChild,
            document.querySelector('.selector__value')
        );
    }

    copyInnerHTML = (source, target) => {
        // eslint-disable-next-line no-param-reassign
        target.innerHTML = source.innerHTML;
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
        this.copyInnerHTML(
            document.getElementById(id),
            document.querySelector('.selector__value')
        );
    };

    render() {
        const { id, disabled, options } = this.props;
        return (
            <div className="selector" disabled={disabled}>
                <div
                    id={id}
                    className="selector__value"
                    onClick={this.handleSelectClick}
                />
                <ul className="selector__options-list">
                    {options.map((option, i) => (
                        <li
                            id={option.id}
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

Select.propTypes = {
    id: PropTypes.string.isRequired,
    disabled: PropTypes.func.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    options: PropTypes.array.isRequired,
};
