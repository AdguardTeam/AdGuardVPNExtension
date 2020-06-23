import {
    tagNode,
    textNode,
    isNode,
    placeholderNode,
    voidTagNode,
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
 * Parses string into AST (abstract syntax tree) and returns it
 * e.g.
 * parse("String to <a>translate</a>") ->
 * ```
 *      [
 *           { type: 'text', value: 'String to ' },
 *           { type: 'tag', value: 'a', children: [{ type: 'text', value: 'translate' }] }
 *      ];
 * ```
 * Empty string is parsed into empty AST (abstract syntax tree): "[]"
 * If founds unbalanced tags, it throws error about it
 *
 * @param {string} str - message in simplified ICU like syntax without plural support
 * @returns {[]}
 */
export const parser = (str = '') => {
    /**
     * Stack is used to keep and search nested tag nodes
     * @type {*[]}
     */
    const stack = [];

    /**
     * Result is stack where function allocates nodes
     * @type {*[]}
     */
    const result = [];

    /**
     * Current char index
     * @type {number}
     */
    let i = 0;

    let currentState = STATE.TEXT;
    let lastTextStateChangeIdx = 0;

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

    /**
     * Checks if text length is enough to create text node
     * If text node created then if stack is not empty it is pushed into stack,
     * otherwise into result
     * @param text
     * @returns {string}
     */
    const placeText = (text) => {
        if (text.length > 0) {
            const node = textNode(text);
            if (stack.length > 0) {
                stack.push(node);
            } else {
                result.push(node);
            }
        }
        return '';
    };

    /**
     * Switches current state to the text state and returns text state handler
     * @returns {function}
     */
    function textStateHandler() {
        currentState = STATE.TEXT;

        return (currChar) => {
            // switches to the tag state
            if (currChar === CONTROL_CHARS.TAG_OPEN_BRACE) {
                lastTextStateChangeIdx = i;
                // eslint-disable-next-line no-use-before-define
                return tagStateHandler();
            }

            if (currChar === CONTROL_CHARS.PLACEHOLDER_MARK) {
                lastTextStateChangeIdx = i;
                // eslint-disable-next-line no-use-before-define
                return placeholderStateHandler();
            }

            text += currChar;
            return textStateHandler();
        };
    }

    /**
     * Switches current state to the tag state and returns tag state handler
     * @returns {function}
     */
    function tagStateHandler() {
        currentState = STATE.TAG;

        return (currChar) => {
            // if found tag end ">"
            if (currChar === CONTROL_CHARS.TAG_CLOSE_BRACE) {
                // if the tag is close tag e.g. </a>
                if (tag.indexOf(CONTROL_CHARS.CLOSING_TAG_MARK) === 0) {
                    tag = tag.substring(1);
                    let children = [];
                    if (text.length > 0) {
                        children.push(textNode(text));
                        text = '';
                    }
                    let pairTagFound = false;
                    // looking for the pair to our close tag
                    while (!pairTagFound && stack.length > 0) {
                        const lastFromStack = stack.pop();
                        // if tag from stack equal to close tag
                        if (lastFromStack === tag) {
                            // create tag node
                            const node = tagNode(tag, children);
                            // and add it to the appropriate stack
                            if (stack.length > 0) {
                                stack.push(node);
                            } else {
                                result.push(node);
                            }
                            children = [];
                            pairTagFound = true;
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
                    tag = '';
                    return textStateHandler();
                }

                // if the tag is void tag e.g. <img/>
                if (tag.lastIndexOf(CONTROL_CHARS.CLOSING_TAG_MARK) === tag.length - 1) {
                    tag = tag.substring(0, tag.length - 1);
                    text = placeText(text);
                    const node = voidTagNode(tag);
                    // add node to the appropriate stack
                    if (stack.length > 0) {
                        stack.push(node);
                    } else {
                        result.push(node);
                    }
                    tag = '';
                    return textStateHandler();
                }

                text = placeText(text);
                stack.push(tag);
                tag = '';
                return textStateHandler();
            }

            // If we meet open tag "<" it means that we wrongly moved into tag state
            if (currChar === CONTROL_CHARS.TAG_OPEN_BRACE) {
                text += str.substring(lastTextStateChangeIdx, i);
                tag = '';
                lastTextStateChangeIdx = i;
                return tagStateHandler();
            }

            tag += currChar;
            return tagStateHandler();
        };
    }

    function placeholderStateHandler() {
        currentState = STATE.PLACEHOLDER;

        return (currChar) => {
            if (currChar === CONTROL_CHARS.PLACEHOLDER_MARK) {
                // if distance between current index and last state change equal to 1,
                // it means that placeholder mark was escaped by itself e.g. "%%",
                // so we return to the text state
                if (i - lastTextStateChangeIdx === 1) {
                    text += str.substring(lastTextStateChangeIdx, i);
                    return textStateHandler();
                }

                lastTextStateChangeIdx = i + 1;
                text = placeText(text);
                const node = placeholderNode(placeholder);
                // place node to the appropriate stack
                if (stack.length > 0) {
                    stack.push(node);
                } else {
                    result.push(node);
                }
                placeholder = '';

                return textStateHandler();
            }

            placeholder += currChar;
            return placeholderStateHandler();
        };
    }

    let currentStateHandler = textStateHandler();

    while (i < str.length) {
        const currChar = str[i];
        currentStateHandler = currentStateHandler(currChar);
        i += 1;
    }

    // Means that tag or placeholder nodes were not closed, so we consider them as text
    if (currentState !== STATE.TEXT) {
        const restText = str.substring(lastTextStateChangeIdx);
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
