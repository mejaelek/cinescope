// ============================================================
// CineScope — js/googleDrive.js
// Google Identity Services (GIS) & Google Drive appDataFolder REST API
// ============================================================

const CLIENT_ID = '847504942373-0loaou93tqtqq8a683h0896oq1hh8lmh.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'cinescope_data.json';

let tokenClient = null;
let accessToken = null;
try {
    accessToken = sessionStorage.getItem('cinescope_gdrive_token') || null;
} catch (e) {
    console.warn('sessionStorage is restricted in this window:', e);
}
let driveFileId = null;
let authSuccessCallback = null;
let authErrorCallback = null;
let setupClientFn = null;

/**
 * Initialize Google Identity Services OAuth 2.0 Token Client
 */
export function initGoogleAuth(onAuthSuccess, onAuthError) {
    if (onAuthSuccess) {
        authSuccessCallback = onAuthSuccess;
    }
    if (onAuthError) {
        authErrorCallback = onAuthError;
    }

    setupClientFn = () => {
        if (!window.google?.accounts?.oauth2) return false;

        try {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                prompt: '', // Empty string avoids forcing the account chooser when consent is already granted
                callback: async (tokenResponse) => {
                    console.log('📬 Google OAuth response received:', tokenResponse);
                    if (tokenResponse.error) {
                        console.error('❌ Google OAuth error:', tokenResponse.error, tokenResponse);
                        if (authErrorCallback) authErrorCallback(tokenResponse);
                        return;
                    }
                    accessToken = tokenResponse.access_token;
                    console.log('✅ Access token successfully acquired!');
                    try {
                        sessionStorage.setItem('cinescope_gdrive_token', accessToken);
                    } catch (e) {
                        console.warn('sessionStorage is restricted in this window:', e);
                    }
                    if (authSuccessCallback) {
                        await authSuccessCallback();
                    }
                },
                error_callback: (err) => {
                    console.error('❌ Google Identity Error:', err);
                    if (authErrorCallback) {
                        authErrorCallback(err);
                    } else {
                        if (err.type === 'popup_failed_to_open') {
                            alert('Your browser blocked the Google Login popup! Look at the right side of the address bar to allow popups.');
                        } else if (err.type === 'popup_closed') {
                            console.warn('The Google login popup was closed before finishing.');
                        }
                    }
                },
            });

            // Re-sync existing session token if available
            try {
                const savedToken = sessionStorage.getItem('cinescope_gdrive_token');
                if (savedToken) {
                    accessToken = savedToken;
                }
            } catch (e) {
                console.warn('sessionStorage is restricted in this window:', e);
            }

            return true;
        } catch (err) {
            console.error('Failed to initialize Google token client:', err);
            return false;
        }
    };

    if (!setupClientFn()) {
        const gsiScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (gsiScript) {
            gsiScript.addEventListener('load', () => setupClientFn());
        }

        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (setupClientFn() || attempts > 50) {
                clearInterval(checkInterval);
            }
        }, 100);
    }
}

/**
 * Prompt the user to log in with Google (Runs strictly synchronously within user gesture)
 */
export function loginWithGoogle() {
    console.log('🔑 loginWithGoogle called (v4)');

    // If client wasn't ready yet, attempt immediate synchronous setup
    if (!tokenClient && typeof setupClientFn === 'function') {
        setupClientFn();
    } else if (!tokenClient && window.google?.accounts?.oauth2) {
        initGoogleAuth(authSuccessCallback, authErrorCallback);
    }

    if (tokenClient) {
        console.log('🚀 Requesting Google access token (v4)...');
        // Calling requestAccessToken() without the forced 'select_account' override
        // allows Google to reuse existing consent/session smoothly.
        tokenClient.requestAccessToken();
    } else {
        alert('Google authentication service is still connecting. Please click again in a moment.');
    }
}

export function isGoogleSignedIn() {
    return Boolean(accessToken);
}

export function logoutGoogle(revokeRemote = false) {
    const doLogout = () => {
        accessToken = null;
        driveFileId = null;
        try {
            sessionStorage.removeItem('cinescope_gdrive_token');
        } catch (e) {}
        window.location.reload();
    };

    if (revokeRemote && accessToken && window.google?.accounts?.oauth2?.revoke) {
        window.google.accounts.oauth2.revoke(accessToken, doLogout);
    } else {
        doLogout();
    }
}

// ── Google Drive API REST Helpers ────────────────────────────

/**
 * Locate cinescope_data.json in appDataFolder (excludes trashed files)
 */
async function findAppDataFile() {
    if (driveFileId) return driveFileId;
    if (!accessToken) return null;

    const query = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name)`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Drive list error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
        driveFileId = data.files[0].id;
        return driveFileId;
    }
    return null;
}

/**
 * Download data payload from Google Drive
 */
export async function loadFromDrive() {
    if (!accessToken) return null;

    const fileId = await findAppDataFile();
    if (!fileId) return null; // File does not exist yet

    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!res.ok) {
        if (res.status === 404) {
            driveFileId = null; // File was deleted remotely
            return null;
        }
        const errText = await res.text();
        throw new Error(`Drive download error (${res.status}): ${errText}`);
    }

    return res.json();
}

/**
 * Save data payload to Google Drive (Creates if new, updates if existing)
 */
export async function saveToDrive(payload) {
    if (!accessToken) {
        console.warn('saveToDrive skipped: not signed in');
        return;
    }

    let fileId = await findAppDataFile();
    const content = JSON.stringify(payload, null, 2);

    if (!fileId) {
        // Step 1: Create metadata entry in appDataFolder
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: FILE_NAME,
                parents: ['appDataFolder'],
            }),
        });

        if (!createRes.ok) {
            const errText = await createRes.text();
            throw new Error(`Drive create failed (${createRes.status}): ${errText}`);
        }

        const data = await createRes.json();
        fileId = data.id;
        driveFileId = fileId;
    }

    // Step 2: Upload / update JSON content using media upload
    const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: content,
        }
    );

    if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(`Drive upload failed (${updateRes.status}): ${errText}`);
    }

    return await updateRes.json();
}

// Attach debug helper to window for DevTools testing
if (typeof window !== 'undefined') {
    window.cinescopeDrive = {
        login: loginWithGoogle,
        logout: logoutGoogle,
        save: saveToDrive,
        load: loadFromDrive,
        find: findAppDataFile,
        isLoggedIn: isGoogleSignedIn,
        getToken: () => accessToken,
    };
}