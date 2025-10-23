
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

// IMPORTANT: Do not expose this service account key to the client-side.
// This is a server-only configuration.
const serviceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG
  ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG)
  : undefined;

const ADMIN_APP_NAME = 'firebase-admin-app';

/**
 * Initializes and returns a Firebase Admin App instance.
 * It ensures that the app is initialized only once (singleton pattern).
 *
 * @returns {App} The initialized Firebase Admin App.
 * @throws {Error} If the service account key is not available in the environment variables.
 */
export function initializeAdminApp(): App {
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return existingApp;
  }

  if (!serviceAccount) {
    throw new Error(
      'Firebase Admin SDK service account key is not available. ' +
      'Please set the FIREBASE_ADMIN_SDK_CONFIG environment variable.'
    );
  }

  const adminApp = initializeApp(
    {
      credential: cert(serviceAccount),
    },
    ADMIN_APP_NAME
  );

  return adminApp;
}
