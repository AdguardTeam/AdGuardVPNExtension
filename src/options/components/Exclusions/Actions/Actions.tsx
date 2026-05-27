/* eslint-disable no-await-in-loop */
import React, { useContext, useState, useRef } from 'react';
import { observer } from 'mobx-react';

import identity from 'lodash/identity';
import { format } from 'date-fns/format';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { isValidExclusion } from '../../../../common/utils/string';
import { log } from '../../../../common/logger';
import { messenger } from '../../../../common/messenger';
import { ExclusionsMode, type ExclusionsMap } from '../../../../common/exclusionsConstants';
import { Select } from '../../../../common/components/Select';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';

import { SelectListModal } from './SelectListModal';
import { ExclusionDataType, type ExclusionsImportData, readExclusionsFile } from './fileHelpers';
import { RemoveAllModal } from './RemoveAllModal';

import './actions.pcss';

enum Action {
    Default = 'default',
    Export = 'export',
    Import = 'import',
    Remove = 'remove',
}

/**
 * Splits, trims, validates and reverses exclusion lines from imported text.
 *
 * @param exclusionsString Raw text content from an imported file.
 * @returns Valid exclusions in reverse order.
 */
const prepareExclusionsAfterImport = (exclusionsString: string): string[] => {
    return exclusionsString
        .split('\n')
        .map((str) => str.trim())
        .filter(identity)
        .filter((exclusionStr) => {
            if (isValidExclusion(exclusionStr)) {
                return true;
            }
            log.debug(`[vpn.Actions]: Invalid exclusion: ${exclusionStr}`);
            return false;
        })
        .reverse();
};

/**
 * Imports exclusions into the regular (general) list.
 *
 * @param exclusionsString Raw text content from an imported file.
 * @param profileId Profile to import into. Uses active profile if omitted.
 * @returns Number of exclusions added.
 */
const handleGeneralExclusionsString = async (
    exclusionsString: string,
    profileId: string,
): Promise<number> => {
    const generalExclusions = prepareExclusionsAfterImport(exclusionsString);
    return messenger.addRegularExclusions(profileId, generalExclusions);
};

/**
 * Imports exclusions into the selective list.
 *
 * @param exclusionsString Raw text content from an imported file.
 * @param profileId Profile to import into. Uses active profile if omitted.
 * @returns Number of exclusions added.
 */
const handleSelectiveExclusionsString = async (
    exclusionsString: string,
    profileId: string,
): Promise<number> => {
    const selectiveExclusions = prepareExclusionsAfterImport(exclusionsString);
    return messenger.addSelectiveExclusions(profileId, selectiveExclusions);
};

const EXCLUSION_FILES_EXTENSIONS = {
    GENERAL: '.general.txt',
    SELECTIVE: '.selective.txt',
};

/**
 * Exports regular and selective exclusions as a timestamped ZIP file.
 *
 * @param profileId Profile to export from. Uses active profile if omitted.
 */
const exportExclusions = async (profileId: string): Promise<void> => {
    const nowFormatted = format(Date.now(), 'yyyy_MM_dd-HH_mm_ss');
    const zipFilename = `exclusions-${nowFormatted}.zip`;

    const zip = new JSZip();

    const generalExclusions = await messenger.getGeneralExclusions(profileId);
    const selectiveExclusions = await messenger.getSelectiveExclusions(profileId);

    zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.GENERAL}`, generalExclusions);
    zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.SELECTIVE}`, selectiveExclusions);

    const zipContent = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(zipContent, zipFilename);
};

/**
 * Actions component props.
 */
interface ActionsProps {
    /**
     * Whether the component is rendered inside a profile context.
     */
    isProfileContext: boolean;
}

export const Actions = observer(({ isProfileContext }: ActionsProps) => {
    const { exclusionsStore, notificationsStore, telemetryStore } = useContext(rootStore);
    const { selectListModalOpen } = exclusionsStore;

    const importEl = useRef<HTMLInputElement>(null);

    const [fileContent, setFileContent] = useState('');

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogImportedExclusions,
        selectListModalOpen,
    );

    const closeSelectListModal = (): void => {
        exclusionsStore.closeSelectListModal();
        setFileContent('');
    };

    const openSelectListModal = (): void => {
        exclusionsStore.openSelectListModal();
    };

    const handleRegularClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ImportGeneralExclusionsClick,
            TelemetryScreenName.DialogImportedExclusions,
        );
        const exclusionsAddedCount = await handleGeneralExclusionsString(
            fileContent,
            exclusionsStore.effectiveProfileId,
        );
        notificationsStore.notifySuccess(
            translator.getMessage(
                'options_exclusions_import_successful',
                { count: exclusionsAddedCount },
            ),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );
        await exclusionsStore.updateExclusionsData();
        closeSelectListModal();
    };

    const handleSelectiveClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ImportSelectiveExclusionsClick,
            TelemetryScreenName.DialogImportedExclusions,
        );
        const exclusionsAddedCount = await handleSelectiveExclusionsString(
            fileContent,
            exclusionsStore.effectiveProfileId,
        );
        notificationsStore.notifySuccess(
            translator.getMessage(
                'options_exclusions_import_successful',
                { count: exclusionsAddedCount },
            ),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );
        await exclusionsStore.updateExclusionsData();
        closeSelectListModal();
    };

    const handleTxtExclusionsData = (content: string): null => {
        setFileContent(content);
        openSelectListModal();
        return null;
    };

    const handleAction = async (action: Action): Promise<void> => {
        const screenName = isProfileContext
            ? TelemetryScreenName.ProfileExclusionScreen
            : TelemetryScreenName.ExclusionsScreen;

        switch (action) {
            case Action.Export: {
                telemetryStore.sendCustomEvent(
                    isProfileContext
                        ? TelemetryActionName.ProfileExportExclusionsClick
                        : TelemetryActionName.ExportExclusionsClick,
                    screenName,
                );
                await exportExclusions(exclusionsStore.effectiveProfileId);
                break;
            }
            case Action.Import: {
                telemetryStore.sendCustomEvent(
                    isProfileContext
                        ? TelemetryActionName.ProfileOpenImportExclusionsClick
                        : TelemetryActionName.OpenImportExclusionsClick,
                    screenName,
                );
                if (importEl.current) {
                    importEl.current.click();
                }
                break;
            }
            case Action.Remove: {
                telemetryStore.sendCustomEvent(
                    isProfileContext
                        ? TelemetryActionName.ProfileOpenRemoveExclusionsClick
                        : TelemetryActionName.OpenRemoveExclusionsClick,
                    screenName,
                );
                await exclusionsStore.openRemoveAllModal();
                break;
            }
            default: break;
        }
    };

    const handleExclusionsData = async (exclusionsData: ExclusionsImportData[]): Promise<any> => {
        const txtExclusionsData = exclusionsData.find((d) => d.type === ExclusionDataType.Txt);

        if (txtExclusionsData) {
            return handleTxtExclusionsData(txtExclusionsData.content);
        }

        const exclusionsContentMap: ExclusionsMap = {
            [ExclusionsMode.Regular]: [],
            [ExclusionsMode.Selective]: [],
        };

        for (let i = 0; i < exclusionsData.length; i += 1) {
            const { type, content } = exclusionsData[i];
            if (type === ExclusionDataType.General) {
                // eslint-disable-next-line max-len
                exclusionsContentMap[ExclusionsMode.Regular] = prepareExclusionsAfterImport(content);
            } else if (type === ExclusionDataType.Selective) {
                // eslint-disable-next-line max-len
                exclusionsContentMap[ExclusionsMode.Selective] = prepareExclusionsAfterImport(content);
            }
        }

        const addedExclusions = messenger.addExclusionsMap(exclusionsStore.effectiveProfileId, exclusionsContentMap);
        return addedExclusions;
    };

    const inputChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        if (!e.target.files) {
            return;
        }

        exclusionsStore.setImportingExclusions(true);

        const [file] = e.target.files;
        e.target.value = '';

        try {
            const exclusionsData = await readExclusionsFile(file);
            const exclusionsAdded = await handleExclusionsData(exclusionsData);
            if (exclusionsAdded !== null) {
                notificationsStore.notifySuccess(
                    translator.getMessage(
                        'options_exclusions_import_successful',
                        { count: exclusionsAdded },
                    ),
                    {
                        action: translator.getMessage('settings_exclusions_undo'),
                        handler: exclusionsStore.restoreExclusions,
                    },
                );
                await exclusionsStore.updateExclusionsData();
            }
            exclusionsStore.setImportingExclusions(false);
        } catch (e) {
            notificationsStore.notifyError(e.message);
            exclusionsStore.setImportingExclusions(false);
        }
    };

    return (
        <>
            <div className="actions">
                <Select
                    value={Action.Default}
                    options={[
                        {
                            value: Action.Default,
                            title: translator.getMessage('settings_exclusion_actions'),
                            shouldSkip: true,
                        },
                        {
                            value: Action.Export,
                            title: translator.getMessage('settings_exclusions_action_export'),
                            shouldSkip: exclusionsStore.isAllExclusionsListsEmpty,
                        },
                        {
                            value: Action.Import,
                            title: translator.getMessage('settings_exclusions_action_import'),
                        },
                        {
                            value: Action.Remove,
                            title: translator.getMessage('settings_exclusions_action_remove_all'),
                            shouldSkip: exclusionsStore.isCurrentModeExclusionsListEmpty,
                        },
                    ]}
                    onChange={handleAction}
                />
                <input
                    type="file"
                    accept=".txt, .zip"
                    ref={importEl}
                    onChange={inputChangeHandler}
                    style={{ display: 'none' }}
                />
            </div>
            <SelectListModal
                isOpen={selectListModalOpen}
                closeModal={closeSelectListModal}
                handleRegularClick={handleRegularClick}
                handleSelectiveClick={handleSelectiveClick}
            />
            <RemoveAllModal />
        </>
    );
});
