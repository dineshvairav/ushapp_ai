
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Auth trigger to create a user profile document in Firestore when a new user signs up
export const createUserProfileDocument = functions.auth.user().onCreate(async (user) => {
  logger.info(`New user created: UID: ${user.uid}, Email: ${user.email}`);
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
      joinDate: user.metadata.creationTime, // ISO string
      disabled: user.disabled,
    });
    logger.info(`Successfully created Firestore profile for UID: ${user.uid}`);
  } catch (error) {
    logger.error(`Error creating Firestore profile for UID: ${user.uid}`, error);
  }
});


// Callable function to list all users with their roles from Firestore
export const listAllUsers = functions.https.onCall(async (data, context) => {
  logger.info("listAllUsers called by UID:", context.auth?.uid);

  if (!context.auth || !context.auth.uid) {
    logger.error("listAllUsers: Authentication token not available or UID missing.");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const callerUid = context.auth.uid;
  try {
    const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
    if (!callerProfileDoc.exists || !callerProfileDoc.data()?.isAdmin) {
      logger.warn(`listAllUsers: Caller ${callerUid} is not an admin.`);
      throw new functions.https.HttpsError(
        "permission-denied",
        "You must be an admin to list users."
      );
    }
    logger.info(`listAllUsers: Caller ${callerUid} verified as admin.`);

    const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users per page
    const usersWithProfiles = await Promise.all(
      listUsersResult.users.map(async (userRecord) => {
        const profileDoc = await db.collection("userProfiles").doc(userRecord.uid).get();
        const profileData = profileDoc.exists ? profileDoc.data() : {};
        return {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          disabled: userRecord.disabled,
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          isAdmin: profileData?.isAdmin || false,
          isDealer: profileData?.isDealer || false,
          phone: profileData?.phone || null,
        };
      })
    );
    logger.info(`listAllUsers: Successfully fetched ${usersWithProfiles.length} users.`);
    return usersWithProfiles;
  } catch (error) {
    logger.error("listAllUsers: Error listing users or fetching profiles:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "An internal error occurred while listing users.");
  }
});

// Callable function to manage user roles (isAdmin, isDealer) in Firestore
export const manageUserRole = functions.https.onCall(async (data, context) => {
  logger.info("manageUserRole called by UID:", context.auth?.uid, "with data:", data);

  if (!context.auth || !context.auth.uid) {
    logger.error("manageUserRole: Authentication token not available or UID missing.");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const callerUid = context.auth.uid;
  const { targetUid, roleName, value } = data;

  if (!targetUid || typeof targetUid !== "string" ||
      !roleName || (roleName !== "isAdmin" && roleName !== "isDealer") ||
      typeof value !== "boolean") {
    logger.error("manageUserRole: Invalid input data:", data);
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid arguments provided. Required: targetUid (string), roleName ('isAdmin' or 'isDealer'), value (boolean)."
    );
  }

  try {
    const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
    if (!callerProfileDoc.exists || !callerProfileDoc.data()?.isAdmin) {
      logger.warn(`manageUserRole: Caller ${callerUid} is not an admin.`);
      throw new functions.https.HttpsError(
        "permission-denied",
        "You must be an admin to manage user roles."
      );
    }
    logger.info(`manageUserRole: Caller ${callerUid} verified as admin.`);

    const targetUserProfileRef = db.collection("userProfiles").doc(targetUid);
    await targetUserProfileRef.update({ [roleName]: value });

    logger.info(`manageUserRole: Successfully updated ${roleName} to ${value} for user ${targetUid}.`);
    return { success: true, message: `User ${targetUid} ${roleName} status updated to ${value}.` };
  } catch (error) {
    logger.error(`manageUserRole: Error updating role for user ${targetUid}:`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", `Failed to update ${roleName} for user.`);
  }
});

// Callable function to manage user's disabled status in Firebase Auth
export const manageUserDisabledStatus = functions.https.onCall(async (data, context) => {
  logger.info("manageUserDisabledStatus called by UID:", context.auth?.uid, "with data:", data);

  if (!context.auth || !context.auth.uid) {
    logger.error("manageUserDisabledStatus: Authentication token not available or UID missing.");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const callerUid = context.auth.uid;
  const { targetUid, disabled } = data;

  if (!targetUid || typeof targetUid !== "string" || typeof disabled !== "boolean") {
    logger.error("manageUserDisabledStatus: Invalid input data:", data);
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid arguments provided. Required: targetUid (string), disabled (boolean)."
    );
  }

  try {
    const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
    if (!callerProfileDoc.exists || !callerProfileDoc.data()?.isAdmin) {
      logger.warn(`manageUserDisabledStatus: Caller ${callerUid} is not an admin.`);
      throw new functions.https.HttpsError(
        "permission-denied",
        "You must be an admin to manage user status."
      );
    }
    logger.info(`manageUserDisabledStatus: Caller ${callerUid} verified as admin.`);

    await admin.auth().updateUser(targetUid, { disabled });
    // Also update the disabled status in their Firestore profile for consistency
    await db.collection("userProfiles").doc(targetUid).update({ disabled });

    logger.info(`manageUserDisabledStatus: Successfully set disabled status to ${disabled} for user ${targetUid}.`);
    return { success: true, message: `User ${targetUid} disabled status updated to ${disabled}.` };
  } catch (error) {
    logger.error(`manageUserDisabledStatus: Error updating disabled status for user ${targetUid}:`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to update user disabled status.");
  }
});
