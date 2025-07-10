import { main } from './main';

// Execute main and export the promise for other modules to await
export const mainInitializationPromise = main();
