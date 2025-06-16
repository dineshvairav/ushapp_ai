'use strict'; // Ensure strict mode
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
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const functionsV2 = __importStar(require("firebase-functions/v2")); // Main v2 import
// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// Auth trigger (v2) to create a user profile document in Firestore when a new user signs up
exports.createUserProfileDocument = functionsV2.auth.onUserCreated(async (event) => {
    var _a;
    const user = event.data; // The user object is in event.data
    if (!user) {
        logger.error('User data undefined in onUserCreated event. Full event:', event);
        return;
    }
    logger.info(`New user created (v2): UID: ${user.uid}, Email: ${user.email}`);
    const userProfileRef = db.collection('userProfiles').doc(user.uid);
    try {
        await userProfileRef.set({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            isAdmin: false, // Default role
            isDealer: false, // Default role
            phone: user.phoneNumber || null,
            joinDate: ((_a = user.metadata) === null || _a === void 0 ? void 0 : _a.creationTime) || new Date().toISOString(), // ISO string
            disabled: user.disabled,
        });
        logger.info(`Successfully created Firestore profile for UID: ${user.uid}`);
    }
    catch (error) {
        logger.error(`Error creating Firestore profile for UID: ${user.uid}`, error);
    }
});
// Callable function (v2) to list all users with their roles from Firestore
exports.listAllUsers = functionsV2.https.onCall(async (request) => {
    var _a;
    logger.info('listAllUsers callable function (v2) invoked by UID:', (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid);
    if (!request.auth || !request.auth.uid) {
        logger.error('listAllUsers (v2): Authentication token not available or UID missing.');
        throw new functionsV2.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const callerUid = request.auth.uid;
    logger.info(`listAllUsers (v2): Verifying admin status for caller UID: ${callerUid}`);
    try {
        const callerProfileDoc = await db.collection('userProfiles').doc(callerUid).get();
        if (!callerProfileDoc.exists) {
            logger.warn(`listAllUsers (v2): Admin check failed. Firestore profile not found for caller ${callerUid}.`);
            throw new functionsV2.https.HttpsError('permission-denied', 'Admin verification failed: Profile not found.');
        }
        const callerProfileData = callerProfileDoc.data();
        if (!(callerProfileData === null || callerProfileData === void 0 ? void 0 : callerProfileData.isAdmin)) {
            logger.warn(`listAllUsers (v2): Caller ${callerUid} is not an admin. isAdmin: ${callerProfileData === null || callerProfileData === void 0 ? void 0 : callerProfileData.isAdmin}`);
            throw new functionsV2.https.HttpsError('permission-denied', 'You must be an admin to list users.');
        }
        logger.info(`listAllUsers (v2): Caller ${callerUid} verified as admin.`);
        const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users per page
        logger.info(`listAllUsers (v2): Fetched ${listUsersResult.users.length} users from Firebase Auth.`);
        const usersWithProfilesPromises = listUsersResult.users.map(async (userRecord) => {
            let profileData = {};
            try {
                const profileDoc = await db.collection('userProfiles').doc(userRecord.uid).get();
                if (profileDoc.exists) {
                    profileData = profileDoc.data() || {};
                }
                else {
                    logger.warn(`listAllUsers (v2): No Firestore profile found for Auth user UID: ${userRecord.uid}. Using default roles.`);
                }
            }
            catch (profileError) {
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
                isAdmin: (profileData === null || profileData === void 0 ? void 0 : profileData.isAdmin) || false,
                isDealer: (profileData === null || profileData === void 0 ? void 0 : profileData.isDealer) || false,
                phone: (profileData === null || profileData === void 0 ? void 0 : profileData.phone) || null,
            };
        });
        const usersWithProfiles = await Promise.all(usersWithProfilesPromises);
        logger.info(`listAllUsers (v2): Successfully processed ${usersWithProfiles.length} users with their profiles.`);
        return usersWithProfiles;
    }
    catch (error) {
        logger.error('listAllUsers (v2): Top-level unexpected error occurred.', {
            message: error.message,
            stack: error.stack,
            details: error instanceof functionsV2.https.HttpsError ? error.details : undefined,
            originalError: error,
        });
        if (error instanceof functionsV2.https.HttpsError) {
            throw error;
        }
        const errorMessage = typeof error.message === 'string' ? error.message : 'An unexpected internal error occurred while listing users.';
        const errorDetails = {
            originalError: typeof error.toString === 'function' ? error.toString() : 'Error object could not be stringified.',
            stack: typeof error.stack === 'string' ? error.stack : 'No stack trace available.',
        };
        throw new functionsV2.https.HttpsError('internal', errorMessage, errorDetails);
    }
});
// Callable function (v2) to manage user roles (isAdmin, isDealer) in Firestore
exports.manageUserRole = functionsV2.https.onCall(async (request) => {
    var _a, _b;
    logger.info('manageUserRole (v2) called by UID:', (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid, 'with data:', request.data);
    if (!request.auth || !request.auth.uid) {
        logger.error('manageUserRole (v2): Authentication token not available or UID missing.');
        throw new functionsV2.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const callerUid = request.auth.uid;
    const { targetUid, roleName, value } = request.data;
    if (!targetUid ||
        typeof targetUid !== 'string' ||
        !roleName ||
        (roleName !== 'isAdmin' && roleName !== 'isDealer') ||
        typeof value !== 'boolean') {
        logger.error('manageUserRole (v2): Invalid input data:', request.data);
        throw new functionsV2.https.HttpsError('invalid-argument', "Invalid arguments provided. Required: targetUid (string), roleName ('isAdmin' or 'isDealer'), value (boolean).");
    }
    logger.info(`manageUserRole (v2): Verifying admin status for caller UID: ${callerUid}`);
    try {
        const callerProfileDoc = await db.collection('userProfiles').doc(callerUid).get();
        if (!callerProfileDoc.exists) {
            logger.warn(`manageUserRole (v2): Admin check failed. Firestore profile not found for caller ${callerUid}.`);
            throw new functionsV2.https.HttpsError('permission-denied', 'Admin verification failed: Profile not found.');
        }
        if (!((_b = callerProfileDoc.data()) === null || _b === void 0 ? void 0 : _b.isAdmin)) {
            logger.warn(`manageUserRole (v2): Caller ${callerUid} is not an admin.`);
            throw new functionsV2.https.HttpsError('permission-denied', 'You must be an admin to manage user roles.');
        }
        logger.info(`manageUserRole (v2): Caller ${callerUid} verified as admin.`);
        const targetUserProfileRef = db.collection('userProfiles').doc(targetUid);
        const targetProfileSnap = await targetUserProfileRef.get();
        if (!targetProfileSnap.exists) {
            logger.warn(`manageUserRole (v2): Target user profile ${targetUid} does not exist. It should be created by Auth trigger. Proceeding with update attempt by setting with merge.`);
            await targetUserProfileRef.set({ [roleName]: value }, { merge: true });
        }
        else {
            await targetUserProfileRef.update({ [roleName]: value });
        }
        logger.info(`manageUserRole (v2): Successfully updated ${roleName} to ${value} for user ${targetUid}.`);
        return { success: true, message: `User ${targetUid} ${roleName} status updated to ${value}.` };
    }
    catch (error) {
        logger.error(`manageUserRole (v2): Error updating role for user ${targetUid}:`, error);
        if (error instanceof functionsV2.https.HttpsError)
            throw error;
        throw new functionsV2.https.HttpsError('internal', error.message || `Failed to update ${roleName} for user.`);
    }
});
// Callable function (v2) to manage user's disabled status in Firebase Auth
exports.manageUserDisabledStatus = functionsV2.https.onCall(async (request) => {
    var _a, _b;
    logger.info('manageUserDisabledStatus (v2) called by UID:', (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid, 'with data:', request.data);
    if (!request.auth || !request.auth.uid) {
        logger.error('manageUserDisabledStatus (v2): Authentication token not available or UID missing.');
        throw new functionsV2.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const callerUid = request.auth.uid;
    const { targetUid, disabled } = request.data;
    if (!targetUid || typeof targetUid !== 'string' || typeof disabled !== 'boolean') {
        logger.error('manageUserDisabledStatus (v2): Invalid input data:', request.data);
        throw new functionsV2.https.HttpsError('invalid-argument', 'Invalid arguments provided. Required: targetUid (string), disabled (boolean).');
    }
    logger.info(`manageUserDisabledStatus (v2): Verifying admin status for caller UID: ${callerUid}`);
    try {
        const callerProfileDoc = await db.collection('userProfiles').doc(callerUid).get();
        if (!callerProfileDoc.exists) {
            logger.warn(`manageUserDisabledStatus (v2): Admin check failed. Firestore profile not found for caller ${callerUid}.`);
            throw new functionsV2.https.HttpsError('permission-denied', 'Admin verification failed: Profile not found.');
        }
        if (!((_b = callerProfileDoc.data()) === null || _b === void 0 ? void 0 : _b.isAdmin)) {
            logger.warn(`manageUserDisabledStatus (v2): Caller ${callerUid} is not an admin.`);
            throw new functionsV2.https.HttpsError('permission-denied', 'You must be an admin to manage user status.');
        }
        logger.info(`manageUserDisabledStatus (v2): Caller ${callerUid} verified as admin.`);
        await admin.auth().updateUser(targetUid, { disabled });
        // Also update the 'disabled' status in the Firestore profile for consistency
        await db.collection('userProfiles').doc(targetUid).update({ disabled });
        logger.info(`manageUserDisabledStatus (v2): Successfully set disabled status to ${disabled} for user ${targetUid}.`);
        return { success: true, message: `User ${targetUid} disabled status updated to ${disabled}.` };
    }
    catch (error) {
        logger.error(`manageUserDisabledStatus (v2): Error updating disabled status for user ${targetUid}:`, error);
        if (error instanceof functionsV2.https.HttpsError)
            throw error;
        throw new functionsV2.https.HttpsError('internal', error.message || 'Failed to update user disabled status.');
    }
});
//# sourceMappingURL=index.js.map