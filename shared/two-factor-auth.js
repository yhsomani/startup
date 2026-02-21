/**
 * TalentSphere Two-Factor Authentication Service
 * Implements TOTP-based 2FA using RFC 6238 standard
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorAuth {
    constructor(options = {}) {
        this.options = {
            algorithm: 'SHA1',
            digits: 6,
            period: 30, // 30 seconds
            encoding: 'base32',
            ...options
        };
    }

    /**
     * Generate a secret for TOTP
     */
    generateSecret(options = {}) {
        const mergedOptions = { ...this.options, ...options };
        return speakeasy.generateSecret(mergedOptions);
    }

    /**
     * Generate QR code URL for authenticator app
     */
    async generateQRCodeURL(accountName, issuer, secret) {
        return QRCode.toDataURL(
            `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret.base32}&issuer=${encodeURIComponent(issuer)}&algorithm=${this.options.algorithm}&digits=${this.options.digits}&period=${this.options.period}`
        );
    }

    /**
     * Verify a TOTP token
     */
    verifyToken(token, secret, options = {}) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: this.options.encoding,
            token: token,
            window: options.window || 2, // Allow 2 periods before and after
            ...options
        });
    }

    /**
     * Generate a TOTP token for a given time
     */
    generateToken(secret, options = {}) {
        return speakeasy.totp({
            secret: secret,
            encoding: this.options.encoding,
            ...options
        });
    }

    /**
     * Verify a token with drift tolerance
     */
    verifyWithDrift(token, secret, drift = 1) {
        for (let i = -drift; i <= drift; i++) {
            if (this.verifyToken(token, secret, { time: Date.now() / 1000 + (i * 30) })) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate backup codes for emergency access
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate a random 10-character alphanumeric code
            const code = crypto.randomBytes(5).toString('hex');
            codes.push(code.toUpperCase());
        }
        return codes;
    }

    /**
     * Verify a backup code
     */
    verifyBackupCode(inputCode, storedCodes) {
        // Normalize input (remove spaces, convert to uppercase)
        const normalizedInput = inputCode.replace(/\s+/g, '').toUpperCase();

        // Find and remove the used code
        const index = storedCodes.findIndex(code =>
            code.replace(/\s+/g, '').toUpperCase() === normalizedInput
        );

        if (index !== -1) {
            // Mark code as used by removing it
            storedCodes.splice(index, 1);
            return true;
        }

        return false;
    }
}

// Export singleton instance
const twoFactorAuth = new TwoFactorAuth();

module.exports = {
    TwoFactorAuth,
    twoFactorAuth,
    generateSecret: twoFactorAuth.generateSecret.bind(twoFactorAuth),
    generateQRCodeURL: twoFactorAuth.generateQRCodeURL.bind(twoFactorAuth),
    verifyToken: twoFactorAuth.verifyToken.bind(twoFactorAuth),
    generateToken: twoFactorAuth.generateToken.bind(twoFactorAuth),
    verifyWithDrift: twoFactorAuth.verifyWithDrift.bind(twoFactorAuth),
    generateBackupCodes: twoFactorAuth.generateBackupCodes.bind(twoFactorAuth),
    verifyBackupCode: twoFactorAuth.verifyBackupCode.bind(twoFactorAuth)
};