/**
 * @fileOverview Firebase Cloud Functions for the ushªOªpp application.
 *
 * This file contains the definitions for various backend functions, including:
 * - Auth triggers (e.g., new user creation).
 * - Callable functions for client-invoked actions (e.g., user management, listing all users).
 *
 * It uses Firebase Functions v2 SDK where appropriate and Firebase Admin SDK for backend operations.
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions"; // For v1 style logger or if needed
import { logger } from "firebase-functions"; // Explicit v1 logger for clarity

// v2 SDK imports - direct named imports for subpaths
import { onUserCreated, type AuthEventData } from "firebase-functions/v2/auth";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";

// Initialize Firebase Admin SDK.
// This should only be done once per deployment.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const authAdmin = admin.auth();


// --- Interfaces for Callable Function Data ---
interface ManageUserRoleData {
  targetUid: string;
  roleName: string; // e.g., 'isDealer', 'isAdmin'
  value: boolean;
}

interface ManageUserDisabledStatusData {
  targetUid: string;
  disabled: boolean;
}

// --- Auth Triggers ---

/**
 * Creates a user profile document in Firestore when a new Firebase Auth user is created.
 * Also sets the default 'isDealer' claim to false.
 */
export const createUserProfileDocument = onUserCreated(
  async (event: AuthEventData<admin.auth.UserRecord>) => {
    const user = event.data; // UserRecord from AuthEventData
    logger.info("createUserProfileDocument triggered for UID:", user.uid);

    const userProfile = {
      email: user.email,
      displayName: user.displayName || "Anonymous User",
      photoURL: user.photoURL || null,
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
      roles: {
        // By default, new users are not dealers or admins.
        // These can be changed via a secure admin interface.
        isDealer: false,
        isAdmin: false,
      },
      // You might want to add other default profile fields here
    };

    try {
      await db.collection("userProfiles").doc(user.uid).set(userProfile, { merge: true });
      logger.info(`Successfully created profile for UID: ${user.uid}`);

      // Set default 'isDealer' custom claim to false for new users
      // This ensures the claim exists and is explicitly false by default.
      await authAdmin.setCustomUserClaims(user.uid, {
        isDealer: false,
        isAdmin: false, // Also set isAdmin to false by default
      });
      logger.info(`Default custom claims (isDealer: false, isAdmin: false) set for UID: ${user.uid}`);

    } catch (error) {
      logger.error(`Error in createUserProfileDocument for UID: ${user.uid}:`, error);
      // Consider how to handle this error, e.g., retry logic, or alert an admin.
    }
  }
);


// --- Callable Functions ---

/**
 * Lists all users. Caller must be an authenticated admin.
 * (Note: Listing all users can be resource-intensive for large user bases)
 */
export const listAllUsers = onCall(async (request: CallableRequest<any>) => {
  logger.info("listAllUsers callable function invoked by UID:", request.auth?.uid);

  if (!request.auth || !request.auth.uid) {
    logger.error("listAllUsers: Unauthenticated access attempt.");
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const callerUid = request.auth.uid;
  let isAdmin = false;

  try {
    const userRecord = await authAdmin.getUser(callerUid);
    isAdmin = userRecord.customClaims?.isAdmin === true;
  } catch (error) {
    logger.error("listAllUsers: Error fetching caller's user record:", error);
    throw new HttpsError("internal", "Could not verify caller's admin status.", error);
  }

  if (!isAdmin) {
    logger.warn(`listAllUsers: Non-admin user ${callerUid} attempted to list users.`);
    throw new HttpsError("permission-denied", "Caller does not have administrative privileges.");
  }

  try {
    const listUsersResult = await authAdmin.listUsers(1000); // Adjust as needed, max 1000
    const users = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      disabled: user.disabled,
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
      customClaims: user.customClaims || {}, // Include custom claims
    }));
    logger.info(`listAllUsers: Successfully listed ${users.length} users for admin ${callerUid}.`);
    return { users };
  } catch (error) {
    logger.error("listAllUsers: Error listing users:", error);
    throw new HttpsError("internal", "Failed to list users.", error);
  }
});


/**
 * Manages a specific role (custom claim) for a target user.
 * - Caller must be an authenticated admin.
 * - Expects { targetUid: string, roleName: string, value: boolean } in request.data.
 */
export const manageUserRole = onCall(async (request: CallableRequest<ManageUserRoleData>) => {
  logger.info("manageUserRole called by UID:", request.auth?.uid, "with data:", request.data);

  if (!request.auth || !request.auth.uid) {
    logger.error("manageUserRole: Unauthenticated access attempt.");
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const callerUid = request.auth.uid;
  let isAdmin = false;

  try {
    const userRecord = await authAdmin.getUser(callerUid);
    isAdmin = userRecord.customClaims?.isAdmin === true;
  } catch (error: any) {
    logger.error("manageUserRole: Error fetching caller's user record:", error);
    throw new HttpsError("internal", `Error verifying caller's admin status: ${error.message}`, error);
  }

  if (!isAdmin) {
    logger.warn(`manageUserRole: Non-admin user ${callerUid} attempted to manage roles.`);
    throw new HttpsError("permission-denied", "Caller does not have administrative privileges to manage user roles.");
  }

  const { targetUid, roleName, value } = request.data;

  if (typeof targetUid !== "string" || typeof roleName !== "string" || typeof value !== "boolean") {
    logger.error("manageUserRole: Invalid arguments provided:", request.data);
    throw new HttpsError("invalid-argument", "The function must be called with 'targetUid' (string), 'roleName' (string), and 'value' (boolean).");
  }

  if (roleName !== 'isDealer' && roleName !== 'isAdmin') {
    logger.error("manageUserRole: Invalid roleName provided:", roleName);
    throw new HttpsError("invalid-argument", "Invalid role name. Allowed roles are 'isDealer' or 'isAdmin'.");
  }

  try {
    const targetUserRecord = await authAdmin.getUser(targetUid);
    const currentClaims = targetUserRecord.customClaims || {};
    const updatedClaims = { ...currentClaims, [roleName]: value };

    await authAdmin.setCustomUserClaims(targetUid, updatedClaims);
    logger.info(`manageUserRole: Successfully set role '${roleName}' to '${value}' for user ${targetUid} by admin ${callerUid}.`);
    return {
      success: true,
      message: `User ${targetUid} role '${roleName}' set to ${value}. User may need to re-authenticate for changes to take full effect.`,
    };
  } catch (error: any) {
    logger.error(`manageUserRole: Error setting custom claim for ${targetUid}:`, error);
    throw new HttpsError("internal", `Internal server error while setting custom claim: ${error.message}`, error);
  }
});


/**
 * Manages the disabled status of a target user's account.
 * - Caller must be an authenticated admin.
 * - Expects { targetUid: string, disabled: boolean } in request.data.
 */
export const manageUserDisabledStatus = onCall(async (request: CallableRequest<ManageUserDisabledStatusData>) => {
  logger.info("manageUserDisabledStatus called by UID:", request.auth?.uid, "with data:", request.data);

  if (!request.auth || !request.auth.uid) {
    logger.error("manageUserDisabledStatus: Unauthenticated access attempt.");
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const callerUid = request.auth.uid;
  let isAdmin = false;

  try {
    const userRecord = await authAdmin.getUser(callerUid);
    isAdmin = userRecord.customClaims?.isAdmin === true;
  } catch (error: any) {
    logger.error("manageUserDisabledStatus: Error fetching caller's user record:", error);
    throw new HttpsError("internal", `Error verifying caller's admin status: ${error.message}`, error);
  }

  if (!isAdmin) {
    logger.warn(`manageUserDisabledStatus: Non-admin user ${callerUid} attempted to manage user status.`);
    throw new HttpsError("permission-denied", "Caller does not have administrative privileges to manage user status.");
  }

  const { targetUid, disabled } = request.data;

  if (typeof targetUid !== "string" || typeof disabled !== "boolean") {
    logger.error("manageUserDisabledStatus: Invalid arguments provided:", request.data);
    throw new HttpsError("invalid-argument", "The function must be called with 'targetUid' (string) and 'disabled' (boolean).");
  }

  try {
    await authAdmin.updateUser(targetUid, { disabled: disabled });
    logger.info(`manageUserDisabledStatus: Successfully ${disabled ? "disabled" : "enabled"} account for user ${targetUid} by admin ${callerUid}.`);
    return {
      success: true,
      message: `User ${targetUid} account has been ${disabled ? "disabled" : "enabled"}.`,
    };
  } catch (error: any) {
    logger.error(`manageUserDisabledStatus: Error updating user disabled status for ${targetUid}:`, error);
    throw new HttpsError("internal", `Internal server error while updating user status: ${error.message}`, error);
  }
});
