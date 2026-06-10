/**
 * PsyPyrus AI - Main Entrypoint
 * Hooks UI lifecycle once DOM content loading is complete.
 */

import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize user interface controllers
    UI.init();
    console.log("PsyPyrus AI Web Application environment fully loaded.");
});
