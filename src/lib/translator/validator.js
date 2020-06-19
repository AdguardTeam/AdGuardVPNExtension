import { parser } from './parser';
import { isPlaceholderNode, isTagNode, isTextNode } from './nodes';

/**
 * Compares two ast structures,
 * view tests for examples
 * @param baseAst
 * @param targetAst
 * @returns {boolean}
 */
const areAstStructuresSame = (baseAst, targetAst) => {
    let i = 0;
    let result = true;

    // if ast structures have different lengths, they are not equal
    if (baseAst.length !== targetAst.length) {
        return false;
    }

    while (i < baseAst.length) {
        const baseNode = baseAst[i];
        const targetNode = targetAst[i];
        // ignore text nodes
        if (!isTextNode(baseNode) && !isTextNode(targetNode)) {
            // if both nodes are tag nodes
            if (isTagNode(baseNode) && isTagNode(targetNode)) {
                if (baseNode.value !== targetNode.value) {
                    result = false;
                    break;
                }
                // if values are the same we check tag nodes children
                result = areAstStructuresSame(baseNode.children, targetNode.children);
                if (result === false) {
                    break;
                }
                // if both nodes are placeholders
            } else if (isPlaceholderNode(baseNode) && isPlaceholderNode(targetNode)) {
                if (baseNode.value !== targetNode.value) {
                    result = false;
                    break;
                }
            } else {
                result = false;
                break;
            }
        }
        i += 1;
    }

    return result;
};

/**
 * Validates translation against base string by ast structure
 * @param baseStr
 * @param targetStr
 * @returns {boolean}
 */
export const isTargetStrValid = (baseStr, targetStr) => {
    const baseAst = parser(baseStr);
    const targetAst = parser(targetStr);

    const result = areAstStructuresSame(baseAst, targetAst);

    return result;
};
