import { type ExclusionsHandler } from './exclusions/ExclusionsHandler';
import { type ExclusionsTree } from './ExclusionsTree';

/**
 * Handlers for the two exclusion modes of a profile.
 */
export interface ExclusionsHandlers {
    /**
     * Regular mode exclusions handler.
     */
    regularModeHandler: ExclusionsHandler;

    /**
     * Selective mode exclusions handler.
     */
    selectiveModeHandler: ExclusionsHandler;
}

/**
 * Combined per-profile exclusions data: handlers, inverted flag, and tree.
 */
export interface ProfileExclusionsEntry {
    /**
     * Handlers for regular and selective exclusion modes.
     */
    handlers: ExclusionsHandlers;

    /**
     * Whether the profile uses selective (inverted) mode.
     */
    inverted: boolean;

    /**
     * Exclusions tree built from the current mode's handler.
     */
    tree: ExclusionsTree;
}
