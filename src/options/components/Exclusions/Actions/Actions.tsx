import React, {
    useContext,
    useState,
    useRef,
    useEffect,
} from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';
import punycode from 'punycode/punycode';
import { identity } from 'lodash';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { RemoveAllModal } from './RemoveAllModal';
import { ExclusionDataTypes, readExclusionsFile } from './fileHelpers';
import { translator } from '../../../../common/translator';
import { ExclusionsDataToImport } from '../../../../background/exclusions/exclusions/ExclusionsManager';
import { isValidExclusion } from '../../../../lib/string-utils';

import './actions.pcss';
import { log } from '../../../../lib/logger';

const prepareExclusionsAfterImport = (exclusionsString: string) => {
    return exclusionsString
        .split('\n')
        .map((str) => str.trim())
        .filter(identity)
        .filter((exclusionStr) => {
            if (isValidExclusion(exclusionStr)) {
                return true;
            }
            log.debug(`Invalid exclusion: ${exclusionStr}`);
            return false;
        })
        .reverse();
};

export const Actions = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const [isMoreActionsMenuOpen, setIsMoreActionsMenuOpen] = useState(false);

    const importEl = useRef<HTMLInputElement>(null);
    const moreActionsMenu = useRef<HTMLUListElement>(null);

    const onAddExclusionClick = () => {
        exclusionsStore.openAddExclusionModal();
    };

    const onExportExclusionsClick = async () => {
        await exclusionsStore.exportExclusions();
    };

    const onImportExclusionsClick = () => {
        if (importEl.current) {
            importEl.current.click();
        }
    };

    const onRemoveAllClick = async () => {
        await exclusionsStore.openRemoveAllModal();
    };

    const onMoreActionsClick = () => {
        setIsMoreActionsMenuOpen(!isMoreActionsMenuOpen);
    };


    const handleExclusionsData = async (exclusionsData) => {
        const txtExclusionsData = exclusionsData.find((d) => d.type === ExclusionDataTypes.Txt);
        if (txtExclusionsData) {
            return handleTxtExclusionsData(txtExclusionsData.content);
        }

        let addedExclusions = 0;

        for (let i = 0; i < exclusionsData.length; i += 1) {
            const { type, content } = exclusionsData[i];
            if (type === ExclusionDataTypes.Regular) {
                addedExclusions += await handleRegularExclusionsString(content);
            } else if (type === ExclusionDataTypes.Selective) {
                addedExclusions += await handleSelectiveExclusionsString(content);
            }
        }

        return addedExclusions;
    };

    const inputChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }

        const [file] = e.target.files;
        e.target.value = '';

        try {
            const exclusionsData = await readExclusionsFile(file);
            const exclusionsAdded = await handleExclusionsData(exclusionsData);
            if (exclusionsAdded !== null) {
                notificationsStore.notifySuccess(translator.getMessage(
                    'options_exclusions_import_successful',
                    { count: exclusionsAdded },
                ));
            }
        } catch (e: any) {
            notificationsStore.notifyError(e.message);
        }
    };

    useEffect(() => {
        if (moreActionsMenu.current) {
            moreActionsMenu.current.focus();
        }
    }, [moreActionsMenu]);

    const moreActionsButtonClassnames = classnames('actions__more-actions-button', {
        active: isMoreActionsMenuOpen,
    });

    const moreActionsListClassnames = classnames('actions__more-actions-list', {
        visible: isMoreActionsMenuOpen,
    });

    if (exclusionsStore.exclusionsSearchValue.length > 0) {
        return null;
    }

    return (
        <>
            <div className="actions">
                <button
                    type="button"
                    className="actions__add-website simple-button"
                    onClick={onAddExclusionClick}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_website')}
                </button>
                <button
                    type="button"
                    className={moreActionsButtonClassnames}
                    onMouseDown={onMoreActionsClick}
                >
                    <svg className="actions__more-actions-button__icon">
                        <use xlinkHref="#more-actions" />
                    </svg>
                </button>
                <ul
                    className={moreActionsListClassnames}
                    ref={moreActionsMenu}
                    tabIndex={-1}
                    onBlur={() => setIsMoreActionsMenuOpen(false)}
                >
                    <li onClick={onExportExclusionsClick}>
                        {/* FIXME disable if there are no exclusions */}
                        {reactTranslator.getMessage('settings_exclusions_action_export')}
                    </li>
                    <li onClick={onImportExclusionsClick}>
                        {reactTranslator.getMessage('settings_exclusions_action_import')}
                    </li>
                    <li onClick={onRemoveAllClick}>
                        {/* FIXME disable if there are no exclusions */}
                        {reactTranslator.getMessage('settings_exclusions_action_remove_all')}
                    </li>
                </ul>
                <input
                    type="file"
                    accept=".txt, .zip"
                    ref={importEl}
                    onChange={inputChangeHandler}
                    style={{ display: 'none' }}
                />
            </div>
            <RemoveAllModal />
            {/* FIXME add tooltip? */}
            <div onClick={onMoreActionsClick}>
                {/* ... */}
            </div>
        </>
    );
});
