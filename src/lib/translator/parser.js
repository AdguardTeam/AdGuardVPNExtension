import {
    tagNode,
    textNode,
    isNode,
    placeholderNode,
} from './nodes';

const STATE = {
    /**
     * parser function switches to the text state when parses simple text,
     * or content between open and close tags
     */
    TEXT: 'text',

    /**
     * parser function switches to the tag state when meets open tag brace ("<"), and switches back,
     * when meets closing tag brace (">")
     */
    TAG: 'tag',

    /**
     * Parser function switches to the placeholder state when meets in the text
     * open placeholders brace ("{") and switches back to the text state,
     * when meets close placeholder brace ("}")
     */
    PLACEHOLDER: 'placeholder',
};

const CONTROL_CHARS = {
    TAG_OPEN_BRACE: '<',
    TAG_CLOSE_BRACE: '>',
    CLOSING_TAG_MARK: '/',
    PLACEHOLDER_MARK: '%',
};

/**
 * Parses string into ast (abstract syntax tree) and returns it
 * e.g.
 * parse("String to <a>translate</a>") ->
 * ```
 *      [
 *           { type: 'text', value: 'String to ' },
 *           { type: 'tag', value: 'a', children: [{ type: 'text', value: 'translate' }] }
 *      ];
 * ```
 * Empty string is parsed into empty ast: "[]"
 * If founds unbalanced tags, it throws error about it
 *
 * @param {string} str - message in simplified ICU like syntax without plural support
 * @returns {[]}
 */
export const parser = (str = '') => {
    /**
     * Stack used to keep and search nested tag nodes
     * @type {*[]}
     */
    const stack = [];

    /**
     * In result we put our nodes
     * @type {*[]}
     */
    const result = [];

    /**
     * Current char index
     * @type {number}
     */
    let i = 0;

    let currentState = STATE.TEXT;
    let lastStateChangeIdx = 0;

    /**
     * Accumulated tag value
     * @type {string}
     */
    let tag = '';

    /**
     * Accumulated text value
     * @type {string}
     */
    let text = '';

    /**
     * Accumulated placeholder value
     * @type {string}
     */
    let placeholder = '';

    while (i < str.length) {
        const currChar = str[i];
        switch (currentState) {
            case STATE.TEXT: {
                // switch to the tag state
                if (currChar === CONTROL_CHARS.TAG_OPEN_BRACE) {
                    currentState = STATE.TAG;
                    lastStateChangeIdx = i;
                } else if (currChar === CONTROL_CHARS.PLACEHOLDER_MARK) {
                    currentState = STATE.PLACEHOLDER;
                    lastStateChangeIdx = i;
                } else {
                    text += currChar;
                }
                break;
            }
            case STATE.TAG: {
                // if found tag end
                if (currChar === CONTROL_CHARS.TAG_CLOSE_BRACE) {
                    // if the tag is close tag
                    if (tag.indexOf(CONTROL_CHARS.CLOSING_TAG_MARK) === 0) {
                        tag = tag.substring(1);
                        let children = [];
                        if (text.length > 0) {
                            children.push(textNode(text));
                            text = '';
                        }
                        // search for the opening tag
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            const lastFromStack = stack.pop();
                            if (lastFromStack === tag) {
                                const node = tagNode(tag, children);
                                if (stack.length > 0) {
                                    stack.push(node);
                                } else {
                                    result.push(node);
                                }
                                children = [];
                                break;
                            } else if (isNode(lastFromStack)) {
                                // add nodes between close tag and open tag to the children
                                children.unshift(lastFromStack);
                            } else {
                                throw new Error('String has unbalanced tags');
                            }
                            if (stack.length === 0 && children.length > 0) {
                                throw new Error('String has unbalanced tags');
                            }
                        }
                    } else {
                        if (text.length > 0) {
                            if (stack.length > 0) {
                                stack.push(textNode(text));
                            } else {
                                result.push(textNode(text));
                            }
                            text = '';
                        }
                        stack.push(tag);
                    }
                    currentState = STATE.TEXT;
                    tag = '';
                } else if (currChar === CONTROL_CHARS.TAG_OPEN_BRACE) {
                    // Seems like we wrongly moved into tag state,
                    // return to the text state with accumulated tag string
                    currentState = STATE.TEXT;
                    text += str.substring(lastStateChangeIdx, i);
                    tag = '';
                    i -= 1;
                } else {
                    tag += currChar;
                }
                break;
            }
            case STATE.PLACEHOLDER: {
                if (currChar === CONTROL_CHARS.PLACEHOLDER_MARK) {
                    // if distance between current index and last state change equal to 1,
                    // it means that placeholder mark was escaped by itself e.g. "%%",
                    // so we return to the text state
                    if (i - lastStateChangeIdx === 1) {
                        currentState = STATE.TEXT;
                        text += str.substring(lastStateChangeIdx, i);
                        break;
                    }

                    currentState = STATE.TEXT;
                    lastStateChangeIdx = i + 1;

                    const node = placeholderNode(placeholder);
                    // if stack is not empty add placeholder to the stack
                    if (stack.length > 0) {
                        if (text.length > 0) {
                            stack.push(textNode(text));
                            text = '';
                        }
                        stack.push(node);
                    } else {
                        if (text.length > 0) {
                            result.push(textNode(text));
                            text = '';
                        }
                        result.push(node);
                    }
                    placeholder = '';
                } else {
                    placeholder += currChar;
                }
                break;
            }
            default: {
                throw new Error(`There is no such state ${currentState}`);
            }
        }

        i += 1;
    }

    // Means that tag or placeholder nodes were not closed, so we consider them as text
    if (currentState !== STATE.TEXT) {
        const restText = str.substring(lastStateChangeIdx);
        if ((restText + text).length > 0) {
            result.push(textNode(text + restText));
        }
    } else {
        // eslint-disable-next-line no-lonely-if
        if (text.length > 0) {
            result.push(textNode(text));
        }
    }

    if (stack.length > 0) {
        throw new Error('String has unbalanced tags');
    }

    return result;
};
