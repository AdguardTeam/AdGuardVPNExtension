import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const TwoFactorForm = observer(() => {
    const { authStore } = useContext(rootStore);
    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.authenticate();
    };

    const inputChangeHandler = (e) => {
        const { target: { name, value } } = e;
        authStore.onCredentialsChange(name, value);
    };

    return (
        <form
            className="form"
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__item">
                    <label className="form__label" htmlFor="twoFactor">
                        Code from app:
                    </label>
                    <input
                        id="twoFactor"
                        className="form__input"
                        type="text"
                        name="twoFactor"
                        placeholder="Enter the verification code"
                        value={authStore.credentials.twoFactor}
                        onChange={inputChangeHandler}
                    />
                </div>
                { authStore.error
                && (
                    <div className="form__item-error">
                        {authStore.errorDescription}
                    </div>
                )}
            </div>

            <div className="form__btns">
                <button
                    className="form__btn button--uppercase button button--m button--hundred button--green"
                    type="submit"
                >
                    Confirm
                </button>
            </div>
        </form>
    );
});

export default TwoFactorForm;
