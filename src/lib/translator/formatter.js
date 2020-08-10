import { parser } from './parser';
import {
    isTextNode,
    isTagNode,
    isPlaceholderNode,
    isVoidTagNode,
} from './nodes';

/**
 * Checks if target is function
 * @param target
 * @returns {boolean}
 */
const isFunction = (target) => {
    return typeof target === 'function';
};

const createStringElement = (tagName, children) => {
    if (children) {
        return `<${tagName}>${children.join('')}</${tagName}>`;
    }
    return `<${tagName}/>`;
};

/**
 * This function accepts an AST (abstract syntax tree) which is a result
 * of the parser function call, and converts tree nodes into array of strings replacing node
 * values with provided values.
 * Values is a map with functions or strings, where each key is related to placeholder value
 * or tag value
 * e.g.
 * string "text <tag>tag text</tag> %placeholder%" is parsed into next AST
 *
 *      [
 *          { type: 'text', value: 'text ' },
 *          {
 *              type: 'tag',
 *              value: 'tag',
 *              children: [{ type: 'text', value: 'tag text' }],
 *          },
 *          { type: 'text', value: ' ' },
 *          { type: 'placeholder', value: 'placeholder' }
 *      ];
 *
 * this AST after format and next values
 *
 *      {
 *          // here used template strings, but it can be react components as well
 *          tag: (chunks) => `<b>${chunks}</b>`,
 *          placeholder: 'placeholder text'
 *      }
 *
 * will return next array
 *
 * [ 'text ', '<b>tag text</b>', ' ', 'placeholder text' ]
 *
 * as you can see, <tag> was replaced by <b>, and placeholder was replaced by placeholder text
 *
 * @param ast - AST (abstract syntax tree)
 * @param values
 * @param createElement - function to be used if there is no function for tag in the values map
 * @returns {[]}
 */
const format = (ast = [], values = {}, createElement = createStringElement) => {
    const result = [];

    let i = 0;
    while (i < ast.length) {
        const currentNode = ast[i];
        // if current node is text node, there is nothing to change, append value to the result
        if (isTextNode(currentNode)) {
            result.push(currentNode.value);
        } else if (isTagNode(currentNode)) {
            const children = [...format(currentNode.children, values, createElement)];
            const value = values[currentNode.value];
            if (value) {
                if (isFunction(value)) {
                    result.push(value(children.join('')));
                } else {
                    result.push(value);
                }
            } else {
                result.push(createElement(currentNode.value, children));
            }
        } else if (isVoidTagNode(currentNode)) {
            const value = values[currentNode.value];
            if (value) {
                result.push(value);
            } else {
                result.push(createElement(currentNode.value));
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
 * Function gets AST (abstract syntax tree) or string and formats messages,
 * replacing values accordingly
 * e.g.
 *      const message = formatter('<a>some text</a>', {
 *          a: (chunks) => `<a href="#">${chunks}</a>`,
 *      });
 *      console.log(message); // ['<a href="#">some text</a>']
 * @param message
 * @param values
 * @param createElement
 * @returns {*[]}
 */
export const formatter = (message, values, createElement) => {
    let ast = message;

    if (typeof ast === 'string') {
        ast = parser(ast);
    }

    return format(ast, values, createElement);
};
