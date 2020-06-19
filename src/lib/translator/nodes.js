const NODE_TYPES = {
    PLACEHOLDER: 'placeholder',
    TEXT: 'text',
    TAG: 'tag',
};

const isTextNode = (node) => {
    return node?.type === NODE_TYPES.TEXT;
};

const isTagNode = (node) => {
    return node?.type === NODE_TYPES.TAG;
};

const placeholderNode = (value) => {
    return { type: NODE_TYPES.PLACEHOLDER, value };
};

const textNode = (str) => {
    return { type: NODE_TYPES.TEXT, value: str };
};

const tagNode = (tagName, children) => {
    return { type: NODE_TYPES.TAG, value: tagName, children };
};

const isNode = (checked) => {
    return !!checked?.type;
};

module.exports = {
    placeholderNode,
    isTextNode,
    isTagNode,
    textNode,
    tagNode,
    isNode,
};
