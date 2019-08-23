import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import popupActions from '../../../actions/popupActions';
import rootStore from '../../../stores';


const SignInForm = observer(() => {
    const { authStore } = useContext(rootStore);

    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.authenticate();
    };

    const inputChangeHandler = (e) => {
        const { target: { name, value } } = e;
        authStore.onCredentialsChange(name, value);
    };

    const handleRegisterClick = () => {
        authStore.showRegistration('register');
    };

    return (
        <form
            className={`form form--login${authStore.error && ' form--error'}`}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__item">
                    <label className="form__label" htmlFor="username">
                        Email:
                    </label>
                    <input
                        id="username"
                        className="form__input"
                        type="text"
                        name="username"
                        placeholder="example@mail.com"
                        value={authStore.credentials.username}
                        onChange={inputChangeHandler}
                    />
                </div>
                <div className="form__item">
                    <div className="form__item-header">
                        <label className="form__label" htmlFor="password">
                            Password:
                        </label>
                        <button
                            type="button"
                            className="form__inline-btn button button--inline button--inline-orange"
                            onClick={popupActions.openRecovery}
                        >
                            Lost it?
                        </button>
                    </div>
                    <input
                        id="password"
                        className="form__input"
                        type="password"
                        name="password"
                        onChange={inputChangeHandler}
                        value={authStore.credentials.password}
                    />
                </div>
                { authStore.error
                    && (
                        <div className="form__item-error">
                            {authStore.errorDescription}
                        </div>
                    )
                }
            </div>
            <div className="form__btns">
                <button
                    className="form__btn button button--uppercase button--m button--hundred button--green"
                    type="submit"
                >
                    Log in
                </button>
                <div
                    className="form__btn form__btn--reg"
                    onClick={handleRegisterClick}
                >
                    Don’t have an account?
                    <button type="button" className="button button--inline button--inline-green">Register</button>
                </div>
            </div>
        </form>
    );
});

export default SignInForm;
