import React from 'react';
import PropTypes from 'prop-types';
import settingsStore from '../../stores/settingsStore';
import popupActions from '../../actions/popupActions';

function SignInForm() {
    const submitHandler = async (e) => {
        e.preventDefault();
        const { target } = e;
        // const email = target.email.value;
        // const password = target.password.value;
        const email = 'maximtop@gmail.com';
        const password = 'AijGrVhFxo7CWArv';
        await popupActions.authenticate({ email, password });
    };
    return (
        <form
            className="form"
            onSubmit={submitHandler}
        >
            <div className="form__item">
                <label className="form__label" htmlFor="email">
                    Email:
                </label>
                <input
                    id="email"
                    className="form__input"
                    type="text"
                    name="email"
                    placeholder="example@mail.com"
                />
            </div>
            <div className="form__item">
                <div className="form__item-header">
                    <label className="form__label" htmlFor="password">
                        Password:
                    </label>
                    <button
                        type="button"
                        className="form__inline-btn button button--inline button--inline-green"
                        onClick={popupActions.openRecovery}
                    >
                        Lost the password?
                    </button>
                </div>
                <input
                    id="password"
                    className="form__input"
                    type="password"
                    name="password"
                />
            </div>
            <div className="form__btns">
                <button
                    className="form__btn button button--m button--hundred button--green"
                    type="submit"
                >
                    Login
                </button>
                <button className="form__btn form__btn--reg button button--inline button--inline-green">
                    Register
                </button>
            </div>
        </form>
    );
}

// SignInForm.propTypes = {
//     handleSubmit: PropTypes.func.isRequired,
// };

export default SignInForm;
