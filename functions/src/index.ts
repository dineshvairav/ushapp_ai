/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { onUserCreated, type UserRecord, type AuthEventData } from "firebase-functions/v2/auth"; // Corrected import for UserRecord and added AuthEventData
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";


admin.initializeApp();
const db = admin.firestore();

// Define an interface for the data expected by manageUserRole
interface ManageUserRoleData {
  targetUid: string;
  roleName: "isAdmin" | "isDealer";
  value: boolean;
}

// Define an interface for the data expected by manageUserDisabledStatus
interface ManageUserDisabledStatusData {
  targetUid: string;
  disabled: boolean;
}

// Auth trigger (v2) to create a user profile document in Firestore when a new user signs up
export const createUserProfileDocument = onUserCreated(async (event: AuthEventData<UserRecord>) => { // Correct event type
  const user = event.data; // The user object is in event.data
  logger.info(`New user created (v2): UID: ${user.uid}, Email: ${user.email}`);
  const userProfileRef = db.collection("userProfiles").doc(user.uid);

  try {
    await userProfileRef.set({
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      isAdmin: false, // Default role
      isDealer: false, // Default role
      phone: user.phoneNumber || null,
      joinDate: user.metadata?.creationTime || new Date().toISOString(), // ISO string
      disabled: user.disabled,
    });
    logger.info(`Successfully created Firestore profile for UID: ${user.uid}`);
  } catch (error) {
    logger.error(`Error creating Firestore profile for UID: ${user.uid}`, error);
  }
});


// Callable function (v2) to list all users with their roles from Firestore
export const listAllUsers = onCall(async (request: CallableRequest<any>) => {
  logger.info("listAllUsers callable function (v2) invoked by UID:", request.auth?.uid);

  if (!request.auth || !request.auth.uid) {
    logger.error("listAllUsers (v2): Authentication token not available or UID missing.");
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const callerUid = request.auth.uid;
  logger.info(`listAllUsers (v2): Verifying admin status for caller UID: ${callerUid}`);

  try {
    const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
    if (!callerProfileDoc.exists) {
      logger.warn(`listAllUsers (v2): Admin check failed. Firestore profile not found for caller ${callerUid}.`);
      throw new HttpsError(
        "permission-denied",
        "Admin verification failed: Profile not found."
      );
    }
    const callerProfileData = callerProfileDoc.data();
    if (!callerProfileData?.isAdmin) {
      logger.warn(`listAllUsers (v2): Caller ${callerUid} is not an admin. isAdmin: ${callerProfileData?.isAdmin}`);
      throw new HttpsError(
        "permission-denied",
        "You must be an admin to list users."
      );
    }
    logger.info(`listAllUsers (v2): Caller ${callerUid} verified as admin.`);

    const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users per page
    logger.info(`listAllUsers (v2): Fetched ${listUsersResult.users.length} users from Firebase Auth.`);

    const usersWithProfilesPromises = listUsersResult.users.map(async (userRecord) => {
      let profileData: admin.firestore.DocumentData = {};
      try {
          const profileDoc = await db.collection("userProfiles").doc(userRecord.uid).get();
          if (profileDoc.exists) {
              profileData = profileDoc.data() || {};
          } else {
              logger.warn(`listAllUsers (v2): No Firestore profile found for Auth user UID: ${userRecord.uid}. Using default roles.`);
          }
      } catch (profileError: any) {
          logger.error(`listAllUsers (v2): Error fetching profile for UID ${userRecord.uid}. Message: ${profileError.message}. Stack: ${profileError.stack}`, profileError);
      }
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        isAdmin: (profileData as any)?.isAdmin || false,
        isDealer: (profileData as any)?.isDealer || false,
        phone: (profileData as any)?.phone || null,
      };
    });
    
    const usersWithProfiles = await Promise.all(usersWithProfilesPromises);
    logger.info(`listAllUsers (v2): Successfully processed ${usersWithProfiles.length} users with their profiles.`);
    return usersWithProfiles;

  } catch (error: any) {
    logger.error("listAllUsers (v2): Top-level unexpected error occurred.", {
        message: error.message,
        stack: error.stack,
        details: error instanceof HttpsError ? error.details : undefined,
        originalError: error
    });
    if (error instanceof HttpsError) {
        throw error;
    }
    const errorMessage = typeof error.message === 'string' ? error.message : "An unexpected internal error occurred while listing users.";
    const errorDetails = {
        originalError: typeof error.toString === 'function' ? error.toString() : "Error object could not be stringified.",
        stack: typeof error.stack === 'string' ? error.stack : "No stack trace available."
    };
    throw new HttpsError("internal", errorMessage, errorDetails);
  }
});

// Callable function (v2) to manage user roles (isAdmin, isDealer) in Firestore
export const manageUserRole = onCall(async (request: CallableRequest<ManageUserRoleData>) => {
  logger.info("manageUserRole (v2) called by UID:", request.auth?.uid, "with data:", request.data);

  if (!request.auth || !request.auth.uid) {
    logger.error("manageUserRole (v2): Authentication token not available or UID missing.");
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const callerUid = request.auth.uid;
  const { targetUid, roleName, value } = request.data;

  if (!targetUid || typeof targetUid !== "string" ||
      !roleName || (roleName !== "isAdmin" && roleName !== "isDealer") ||
      typeof value !== "boolean") {
    logger.error("manageUserRole (v2): Invalid input data:", request.data);
    throw new HttpsError(
      "invalid-argument",
      "Invalid arguments provided. Required: targetUid (string), roleName ('isAdmin' or 'isDealer'), value (boolean)."
    );
  }
  logger.info(`manageUserRole (v2): Verifying admin status for caller UID: ${callerUid}`);
  try {
    const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
    if (!callerProfileDoc.exists) {
        logger.warn(`manageUserRole (v2): Admin check failed. Firestore profile not found for caller ${callerUid}.`);
        throw new HttpsError(
            "permission-denied",
            "Admin verification failed: Profile not found."
        );
    }
    if (!callerProfileDoc.data()?.isAdmin) {
      logger.warn(`manageUserRole (v2): Caller ${callerUid} is not an admin.`);
      throw new HttpsError(
        "permission-denied",
        "You must be an admin to manage user roles."
      );
    }
    logger.info(`manageUserRole (v2): Caller ${callerUid} verified as admin.`);

    const targetUserProfileRef = db.collection("userProfiles").doc(targetUid);
    const targetProfileSnap = await targetUserProfileRef.get();
    if (!targetProfileSnap.exists) {
        logger.warn(`manageUserRole (v2): Target user profile ${targetUid} does not exist. It should be created by Auth trigger. Proceeding with update attempt by setting with merge.`);
         await targetUserProfileRef.set({ [roleName]: value }, { merge: true });
    } else {
        await targetUserProfileRef.update({ [roleName]: value });
    }

    logger.info(`manageUserRole (v2): Successfully updated ${roleName} to ${value} for user ${targetUid}.`);
    return { success: true, message: `User ${targetUid} ${roleName} status updated to ${value}.` };
  } catch (error: any) {
    logger.error(`manageUserRole (v2): Error updating role for user ${targetUid}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || `Failed to update ${roleName} for user.`);
  }
});

// Callable function (v2) to manage user's disabled status in Firebase Auth
export const manageUserDisabledStatus = onCall(async (request: CallableRequest<ManageUserDisabledStatusData>) => {
  logger.info("manageUserDisabledStatus (v2) called by UID:", request.auth?.uid, "with data:", request.data);

  if (!request.auth || !request.auth.uid) {
    logger.error("manageUserDisabledStatus (v2): Authentication token not available or UID missing.");
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const callerUid = request.auth.uid;
  const { targetUid, disabled } = request.data;

  if (!targetUid || typeof targetUid !== "string" || typeof disabled !== "boolean") {
    logger.error("manageUserDisabledStatus (v2): Invalid input data:", request.data);
    throw new HttpsError(
      "invalid-argument",
      "Invalid arguments provided. Required: targetUid (string), disabled (boolean)."
    );
  }
  logger.info(`manageUserDisabledStatus (v2): Verifying admin status for caller UID: ${callerUid}`);
  try {
    const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
     if (!callerProfileDoc.exists) {
        logger.warn(`manageUserDisabledStatus (v2): Admin check failed. Firestore profile not found for caller ${callerUid}.`);
        throw new HttpsError(
            "permission-denied",
            "Admin verification failed: Profile not found."
        );
    }
    if (!callerProfileDoc.data()?.isAdmin) {
      logger.warn(`manageUserDisabledStatus (v2): Caller ${callerUid} is not an admin.`);
      throw new HttpsError(
        "permission-denied",
        "You must be an admin to manage user status."
      );
    }
    logger.info(`manageUserDisabledStatus (v2): Caller ${callerUid} verified as admin.`);

    await admin.auth().updateUser(targetUid, { disabled });
    // Also update the 'disabled' status in the Firestore profile for consistency
    await db.collection("userProfiles").doc(targetUid).update({ disabled });

    logger.info(`manageUserDisabledStatus (v2): Successfully set disabled status to ${disabled} for user ${targetUid}.`);
    return { success: true, message: `User ${targetUid} disabled status updated to ${disabled}.` };
  } catch (error: any) {
    logger.error(`manageUserDisabledStatus (v2): Error updating disabled status for user ${targetUid}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to update user disabled status.");
  }
});

