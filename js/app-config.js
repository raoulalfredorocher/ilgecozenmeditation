/**
 * app-config.js
 * Carica i segreti da js/secrets.js (file ignorato da git)
 * e li espone come variabili globali usate dal resto dell'app.
 */
import { FIREBASE_CONFIG, SPOTIFY_CLIENT_ID } from './secrets.js';

window.__FIREBASE_CONFIG__   = FIREBASE_CONFIG;
window.__SPOTIFY_CLIENT_ID__ = SPOTIFY_CLIENT_ID;
