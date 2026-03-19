// Declare other types of files here if you want to import them in project as URL

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.webm' {
    const content: string;
    export default content;
}

declare module '*.module.pcss' {
    const classes: Record<string, string>;
    export default classes;
}

declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
}
