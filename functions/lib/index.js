
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllUsers = exports.manageUserDisabledStatus = exports.manageAdminClaim = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Manages a boolean custom claim for a target user.
 * - Caller must be an authenticated admin.
 * - Expects { targetUid: string, claimName: string, claimValue: boolean } in the data payload.
 */
exports.manageAdminClaim = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const callerIsAdmin = context.auth.token.isAdmin === true;
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Caller does not have administrative privileges.");
    }

    const { targetUid, claimName, claimValue } = data;

    if (typeof targetUid !== "string" || typeof claimName !== "string" || typeof claimValue !== "boolean") {
        throw new functions.https.HttpsError("invalid-argument", "Required fields: targetUid (string), claimName (string), claimValue (boolean).");
    }

    try {
        const user = await admin.auth().getUser(targetUid);
        const currentClaims = user.customClaims || {};
        const newClaims = { ...currentClaims, [claimName]: claimValue };

        await admin.auth().setCustomUserClaims(targetUid, newClaims);
        return {
            success: true,
            message: `User ${targetUid} claim '${claimName}' set to ${claimValue}. Users may need to re-authenticate for claims to take full effect.`,
        };
    } catch (error) {
        console.error("Error setting custom claims:", error);
        let errorMessage = "Internal server error while setting custom claims.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new functions.https.HttpsError("internal", errorMessage, error);
    }
});

/**
 * Manages the disabled status of a target user's account.
 * - Caller must be an authenticated admin.
 * - Expects { targetUid: string, shouldBeDisabled: boolean } in the data payload.
 */
exports.manageUserDisabledStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const callerIsAdmin = context.auth.token.isAdmin === true;
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Caller does not have administrative privileges.");
    }
    const { targetUid, shouldBeDisabled } = data;
    if (typeof targetUid !== "string" || typeof shouldBeDisabled !== "boolean") {
        throw new functions.https.HttpsError("invalid-argument", "Required: targetUid (string), shouldBeDisabled (boolean).");
    }
    try {
        await admin.auth().updateUser(targetUid, {
            disabled: shouldBeDisabled,
        });
        return {
            success: true,
            message: `User ${targetUid} account has been ${shouldBeDisabled ? "disabled" : "enabled"}.`,
        };
    } catch (error) {
        console.error("Error updating user disabled status:", error);
        let errorMessage = "Internal server error while updating user status.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new functions.https.HttpsError("internal", errorMessage, error);
    }
});

/**
 * Lists all users from Firebase Authentication.
 * - Caller must be an authenticated admin.
 * - Returns a list of users with relevant details.
 */
exports.listAllUsers = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const callerIsAdmin = context.auth.token.isAdmin === true;
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Caller does not have administrative privileges to list users.");
    }

    try {
        const listUsersResult = await admin.auth().listUsers(1000); // Default max 1000 users per page
        const users = listUsersResult.users.map(userRecord => {
            return {
                uid: userRecord.uid,
                email: userRecord.email || null,
                displayName: userRecord.displayName || null,
                disabled: userRecord.disabled,
                creationTime: userRecord.metadata.creationTime,
                lastSignInTime: userRecord.metadata.lastSignInTime,
                isAdmin: userRecord.customClaims?.isAdmin === true, // Include isAdmin claim
                isDealer: userRecord.customClaims?.isDealer === true, // Include isDealer claim
                // Add other claims if needed e.g.
                // otherClaim: userRecord.customClaims?.otherClaim
            };
        });
        return { users };
    } catch (error) {
        console.error("Error listing users:", error);
        let errorMessage = "Internal server error while listing users.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new functions.https.HttpsError("internal", errorMessage, error);
    }
});
//# sourceMappingURL=index.js.map
