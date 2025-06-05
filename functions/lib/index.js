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
exports.manageUserDisabledStatus = exports.manageAdminClaim = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK.
// This should only be done once per deployment.
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Manages the 'isAdmin' custom claim for a target user.
 * - Caller must be an authenticated admin.
 * - Expects { targetUid: string, shouldBeAdmin: boolean } in the data payload.
 */
exports.manageAdminClaim = functions.https.onCall(async (data, context) => {
    // 1. Ensure the caller is authenticated.
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // 2. Ensure the caller is an admin (has the 'isAdmin' custom claim).
    // IMPORTANT: The first admin user needs their 'isAdmin' claim set manually
    // (e.g., via a one-time script, or by another trusted admin function).
    const callerIsAdmin = context.auth.token.isAdmin === true;
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Caller does not have administrative privileges to manage admin claims.");
    }
    const { targetUid, shouldBeAdmin } = data;
    // 3. Validate input.
    if (typeof targetUid !== "string" || typeof shouldBeAdmin !== "boolean") {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with 'targetUid' (string) and 'shouldBeAdmin' (boolean).");
    }
    try {
        // 4. Set custom claim on the target user.
        await admin.auth().setCustomUserClaims(targetUid, { isAdmin: shouldBeAdmin });
        return {
            success: true,
            message: `User ${targetUid} admin status set to ${shouldBeAdmin}. Users may need to re-authenticate for the claim to take effect.`,
        };
    }
    catch (error) {
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
    // 1. Ensure the caller is authenticated.
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // 2. Ensure the caller is an admin.
    const callerIsAdmin = context.auth.token.isAdmin === true;
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Caller does not have administrative privileges to manage user status.");
    }
    const { targetUid, shouldBeDisabled } = data;
    // 3. Validate input.
    if (typeof targetUid !== "string" || typeof shouldBeDisabled !== "boolean") {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with 'targetUid' (string) and 'shouldBeDisabled' (boolean).");
    }
    try {
        // 4. Update the user's disabled status.
        await admin.auth().updateUser(targetUid, {
            disabled: shouldBeDisabled,
        });
        return {
            success: true,
            message: `User ${targetUid} account has been ${shouldBeDisabled ? "disabled" : "enabled"}.`,
        };
    }
    catch (error) {
        console.error("Error updating user disabled status:", error);
        let errorMessage = "Internal server error while updating user status.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new functions.https.HttpsError("internal", errorMessage, error);
    }
});
//# sourceMappingURL=index.js.map