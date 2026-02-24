/**
 * IIIT Campus Social Experience Survey
 * google-sheets-client.js — Google Sheets integration layer
 */

'use strict';

// ⚠️ PASTE YOUR APPS SCRIPT WEB APP URL HERE
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0oPbkrV4Kk7lCd0SywQxhkoKwm4Nzd2bG7XZ3Lc2S5JhvLCDPd-fBUPwXJqYnFWRd/exec';

/**
 * Save survey response to Google Sheets.
 */
async function saveToGoogleSheets(record) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.startsWith('PASTE_')) {
        console.warn('[Google Sheets] URL not set, skipping cloud save');
        return { success: false, error: 'URL not set' };
    }

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors for simple POST
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });

        // With no-cors, we can't read the response body, but we assume success if no error thrown
        console.log('[Google Sheets] Response sent to script');
        return { success: true };
    } catch (err) {
        console.error('[Google Sheets] Save error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Fetch all survey responses from Google Sheets for admin dashboard.
 */
async function fetchFromGoogleSheets() {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.startsWith('PASTE_')) {
        console.warn('[Google Sheets] URL not set, falling back to localStorage');
        return null;
    }

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();
        console.log(`[Google Sheets] Fetched ${data.length} responses`);
        return data;
    } catch (err) {
        console.error('[Google Sheets] Fetch error:', err);
        return null;
    }
}
