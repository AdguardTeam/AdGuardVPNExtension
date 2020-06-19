import { parser } from './parser';
import { isTextNode, isTagNode, isPlaceholderNode } from './nodes';

const isFunction = (target) => {
    return typeof target === 'function';
};

const format = (ast, values) => {
    const result = [];

    if (!ast) {
        return result;
    }

    let i = 0;
    while (i < ast.length) {
        const currentNode = ast[i];
        if (isTextNode(currentNode)) {
            result.push(currentNode.value);
        } else if (isTagNode(currentNode)) {
            const children = [...format(currentNode.children, values)].join('');
            const value = values[currentNode.value];
            if (value) {
                if (isFunction(value)) {
                    result.push(value(children));
                } else {
                    result.push(value);
                }
            } else {
                throw new Error(`Value ${currentNode.value} wasn't provided`);
            }
        } else if (isPlaceholderNode(currentNode)) {
            const value = values[currentNode.value];
            if (value) {
                result.push(value);
            } else {
                throw new Error(`Value ${currentNode.value} wasn't provided`);
            }
        }
        i += 1;
    }

    return result;
};

export const formatter = (message, values) => {
    let ast = message;

    if (typeof ast === 'string') {
        ast = parser(ast);
    }

    return format(ast, values);
};
