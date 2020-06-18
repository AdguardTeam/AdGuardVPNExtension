import { messageParser } from './messageParser';

const format = (ast, values) => {
    const result = [];

    let i = 0;
    while (i < ast.length) {
        const currentNode = ast[i];
        if (isTextNode(currentNode)) {
            result.push(currentNode.value);
        } else if (isTagNode(currentNode)) {
            if (currentNode.children) {
                result.push(...format(currentNode.children, values))
            } else {

            }
        }
        i += 1;
    }

    return result;
};

export const messageFormatter = (message, values) => {
    let ast;
    if (typeof message === 'string') {
        ast = messageParser(message);
    } else {
        ast = message;
    }

    return format(ast, values);
};
