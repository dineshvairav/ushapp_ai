"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageUserDisabledStatus = exports.manageUserRole = exports.listAllUsers = exports.createUserProfileDocument = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions")); // Using v1 functions
const logger = __importStar(require("firebase-functions/logger")); // Using v1 logger
admin.initializeApp();
const db = admin.firestore();
// Auth trigger to create a user profile document in Firestore when a new user signs up
exports.createUserProfileDocument = functions.auth.user().onCreate(async (user) => {
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
    }
    catch (error) {
        logger.error(`Error creating Firestore profile for UID: ${user.uid}`, error);
    }
});
// Callable function to list all users with their roles from Firestore
exports.listAllUsers = functions.https.onCall(async (data, context) => {
    var _a;
    logger.info("listAllUsers callable function invoked by UID:", (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid);
    if (!context.auth || !context.auth.uid) {
        logger.error("listAllUsers: Authentication token not available or UID missing.");
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const callerUid = context.auth.uid;
    logger.info(`listAllUsers: Verifying admin status for caller UID: ${callerUid}`);
    try {
        const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
        if (!callerProfileDoc.exists) {
            logger.warn(`listAllUsers: Admin check failed. Firestore profile not found for caller ${callerUid}.`);
            throw new functions.https.HttpsError("permission-denied", "Admin verification failed: Profile not found.");
        }
        const callerProfileData = callerProfileDoc.data();
        if (!(callerProfileData === null || callerProfileData === void 0 ? void 0 : callerProfileData.isAdmin)) {
            logger.warn(`listAllUsers: Caller ${callerUid} is not an admin. isAdmin: ${callerProfileData === null || callerProfileData === void 0 ? void 0 : callerProfileData.isAdmin}`);
            throw new functions.https.HttpsError("permission-denied", "You must be an admin to list users.");
        }
        logger.info(`listAllUsers: Caller ${callerUid} verified as admin.`);
        const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users per page
        logger.info(`listAllUsers: Fetched ${listUsersResult.users.length} users from Firebase Auth.`);
        const usersWithProfilesPromises = listUsersResult.users.map(async (userRecord) => {
            let profileData = {};
            try {
                const profileDoc = await db.collection("userProfiles").doc(userRecord.uid).get();
                if (profileDoc.exists) {
                    profileData = profileDoc.data() || {};
                }
                else {
                    logger.warn(`listAllUsers: No Firestore profile found for Auth user UID: ${userRecord.uid}. Using default roles.`);
                }
            }
            catch (profileError) {
                logger.error(`listAllUsers: Error fetching profile for UID ${userRecord.uid}. Message: ${profileError.message}. Stack: ${profileError.stack}`);
                // Continue with default roles if a single profile fetch fails
            }
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                disabled: userRecord.disabled,
                creationTime: userRecord.metadata.creationTime,
                lastSignInTime: userRecord.metadata.lastSignInTime,
                isAdmin: (profileData === null || profileData === void 0 ? void 0 : profileData.isAdmin) || false,
                isDealer: (profileData === null || profileData === void 0 ? void 0 : profileData.isDealer) || false,
                phone: (profileData === null || profileData === void 0 ? void 0 : profileData.phone) || null,
            };
        });
        const usersWithProfiles = await Promise.all(usersWithProfilesPromises);
        logger.info(`listAllUsers: Successfully processed ${usersWithProfiles.length} users with their profiles.`);
        return usersWithProfiles;
    }
    catch (error) {
        logger.error("listAllUsers: Top-level unexpected error occurred. Message:", error.message, "Stack:", error.stack, "Details:", JSON.stringify(error.details));
        if (error instanceof functions.https.HttpsError) {
            // Re-throw HttpsError to be correctly handled by the client
            throw error;
        }
        // For other errors, wrap it in an HttpsError, ensuring the message is a string
        const errorMessage = typeof error.message === 'string' ? error.message : "An unexpected internal error occurred while listing users.";
        const errorDetails = {
            originalError: typeof error.toString === 'function' ? error.toString() : "Error object could not be stringified.",
            stack: typeof error.stack === 'string' ? error.stack : "No stack trace available."
        };
        throw new functions.https.HttpsError("internal", errorMessage, errorDetails);
    }
});
// Callable function to manage user roles (isAdmin, isDealer) in Firestore
exports.manageUserRole = functions.https.onCall(async (data, context) => {
    var _a, _b;
    logger.info("manageUserRole called by UID:", (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid, "with data:", data);
    if (!context.auth || !context.auth.uid) {
        logger.error("manageUserRole: Authentication token not available or UID missing.");
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const callerUid = context.auth.uid;
    const { targetUid, roleName, value } = data;
    if (!targetUid || typeof targetUid !== "string" ||
        !roleName || (roleName !== "isAdmin" && roleName !== "isDealer") ||
        typeof value !== "boolean") {
        logger.error("manageUserRole: Invalid input data:", data);
        throw new functions.https.HttpsError("invalid-argument", "Invalid arguments provided. Required: targetUid (string), roleName ('isAdmin' or 'isDealer'), value (boolean).");
    }
    logger.info(`manageUserRole: Verifying admin status for caller UID: ${callerUid}`);
    try {
        const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
        if (!callerProfileDoc.exists) {
            logger.warn(`manageUserRole: Admin check failed. Firestore profile not found for caller ${callerUid}.`);
            throw new functions.https.HttpsError("permission-denied", "Admin verification failed: Profile not found.");
        }
        if (!((_b = callerProfileDoc.data()) === null || _b === void 0 ? void 0 : _b.isAdmin)) {
            logger.warn(`manageUserRole: Caller ${callerUid} is not an admin.`);
            throw new functions.https.HttpsError("permission-denied", "You must be an admin to manage user roles.");
        }
        logger.info(`manageUserRole: Caller ${callerUid} verified as admin.`);
        const targetUserProfileRef = db.collection("userProfiles").doc(targetUid);
        const targetProfileSnap = await targetUserProfileRef.get();
        if (!targetProfileSnap.exists) {
            logger.warn(`manageUserRole: Target user profile ${targetUid} does not exist. It should be created by Auth trigger. Proceeding with update attempt by setting with merge.`);
            await targetUserProfileRef.set({ [roleName]: value }, { merge: true });
        }
        else {
            await targetUserProfileRef.update({ [roleName]: value });
        }
        logger.info(`manageUserRole: Successfully updated ${roleName} to ${value} for user ${targetUid}.`);
        return { success: true, message: `User ${targetUid} ${roleName} status updated to ${value}.` };
    }
    catch (error) {
        logger.error(`manageUserRole: Error updating role for user ${targetUid}:`, error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError("internal", error.message || `Failed to update ${roleName} for user.`);
    }
});
// Callable function to manage user's disabled status in Firebase Auth
exports.manageUserDisabledStatus = functions.https.onCall(async (data, context) => {
    var _a, _b;
    logger.info("manageUserDisabledStatus called by UID:", (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid, "with data:", data);
    if (!context.auth || !context.auth.uid) {
        logger.error("manageUserDisabledStatus: Authentication token not available or UID missing.");
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const callerUid = context.auth.uid;
    const { targetUid, disabled } = data;
    if (!targetUid || typeof targetUid !== "string" || typeof disabled !== "boolean") {
        logger.error("manageUserDisabledStatus: Invalid input data:", data);
        throw new functions.https.HttpsError("invalid-argument", "Invalid arguments provided. Required: targetUid (string), disabled (boolean).");
    }
    logger.info(`manageUserDisabledStatus: Verifying admin status for caller UID: ${callerUid}`);
    try {
        const callerProfileDoc = await db.collection("userProfiles").doc(callerUid).get();
        if (!callerProfileDoc.exists) {
            logger.warn(`manageUserDisabledStatus: Admin check failed. Firestore profile not found for caller ${callerUid}.`);
            throw new functions.https.HttpsError("permission-denied", "Admin verification failed: Profile not found.");
        }
        if (!((_b = callerProfileDoc.data()) === null || _b === void 0 ? void 0 : _b.isAdmin)) {
            logger.warn(`manageUserDisabledStatus: Caller ${callerUid} is not an admin.`);
            throw new functions.https.HttpsError("permission-denied", "You must be an admin to manage user status.");
        }
        logger.info(`manageUserDisabledStatus: Caller ${callerUid} verified as admin.`);
        await admin.auth().updateUser(targetUid, { disabled });
        await db.collection("userProfiles").doc(targetUid).update({ disabled });
        logger.info(`manageUserDisabledStatus: Successfully set disabled status to ${disabled} for user ${targetUid}.`);
        return { success: true, message: `User ${targetUid} disabled status updated to ${disabled}.` };
    }
    catch (error) {
        logger.error(`manageUserDisabledStatus: Error updating disabled status for user ${targetUid}:`, error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError("internal", error.message || "Failed to update user disabled status.");
    }
});
//# sourceMappingURL=index.js.map