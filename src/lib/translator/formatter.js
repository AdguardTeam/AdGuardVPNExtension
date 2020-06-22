import { parser } from './parser';
import { isTextNode, isTagNode, isPlaceholderNode } from './nodes';

/**
 * Checks if target is function
 * @param target
 * @returns {boolean}
 */
const isFunction = (target) => {
    return typeof target === 'function';
};

/**
 * Format function gets ast (abstract syntax tree), result of parser function call, and
 * converts nodes into array of strings replacing node values with provided
 * @param ast
 * @param values
 * @returns {[]}
 */
const format = (ast = [], values) => {
    const result = [];

    let i = 0;
    while (i < ast.length) {
        const currentNode = ast[i];
        // if current node is text node, there is nothing to change, append value to the result
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

/**
 * Function gets ast or string and formats messages, replacing values accordingly
 * e.g.
 *      const message = formatter('<a>some text</a>', {
 *          a: (chunks) => `<a href="#">${chunks}</a>`,
 *      });
 *      console.log(message); // ['<a href="#">some text</a>']
 * @param message
 * @param values
 * @returns {*[]}
 */
export const formatter = (message, values) => {
    let ast = message;

    if (typeof ast === 'string') {
        ast = parser(ast);
    }

    return format(ast, values);
};
