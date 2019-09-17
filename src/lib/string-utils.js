export const renderTemplate = (template, tags) => {
    return Object.entries(tags).reduce((acc, [key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        return template.replace(regex, value);
    }, template);
};
