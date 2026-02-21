/**
 * TalentSphere Encryption Service
 * Implements encryption for sensitive data at rest and in transit
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class EncryptionService {
    constructor(options = {}) {
        this.options = {
            algorithm: options.algorithm || 'aes-256-gcm',
            keyLength: options.keyLength || 32, // 256 bits
            ivLength: options.ivLength || 16,  // 128 bits
            saltLength: options.saltLength || 16, // 128 bits
            iterations: options.iterations || 100000, // PBKDF2 iterations
            keyEncoding: options.keyEncoding || 'hex',
            dataEncoding: options.dataEncoding || 'utf8',
            outputEncoding: options.outputEncoding || 'hex',
            ...options
        };

        // Initialize master key (in production, this should be securely stored)
        this.masterKey = this.generateMasterKey();
        this.initialized = true;
    }

    /**
     * Generate a cryptographically strong random master key
     */
    generateMasterKey() {
        return crypto.randomBytes(this.options.keyLength);
    }

    /**
     * Derive a key from password using PBKDF2
     */
    deriveKey(password, salt) {
        return crypto.pbkdf2Sync(
            password,
            salt,
            this.options.iterations,
            this.options.keyLength,
            'sha256'
        );
    }

    /**
     * Encrypt data with a derived key
     */
    encrypt(data, key = null) {
        if (!this.initialized) {throw new Error('Encryption service not initialized');}

        const actualKey = key || this.masterKey;
        const iv = crypto.randomBytes(this.options.ivLength);
        const cipher = crypto.createCipher(this.options.algorithm, actualKey);

        let encrypted = cipher.update(data, this.options.dataEncoding, this.options.outputEncoding);
        encrypted += cipher.final(this.options.outputEncoding);

        // Get auth tag for GCM mode
        const authTag = cipher.getAuthTag ? cipher.getAuthTag() : null;

        // Combine IV, encrypted data, and auth tag
        const result = {
            data: encrypted,
            iv: iv.toString(this.options.outputEncoding),
            authTag: authTag ? authTag.toString(this.options.outputEncoding) : null,
            algorithm: this.options.algorithm
        };

        return result;
    }

    /**
     * Decrypt data with a derived key
     */
    decrypt(encryptedObj, key = null) {
        if (!this.initialized) {throw new Error('Encryption service not initialized');}

        const actualKey = key || this.masterKey;
        const decipher = crypto.createDecipher(this.options.algorithm, actualKey);

        // Set auth tag for GCM mode
        if (encryptedObj.authTag && decipher.setAuthTag) {
            const authTagBuffer = Buffer.from(encryptedObj.authTag, this.options.outputEncoding);
            decipher.setAuthTag(authTagBuffer);
        }

        // Set IV
        const ivBuffer = Buffer.from(encryptedObj.iv, this.options.outputEncoding);

        // Create decipher with IV
        const decipherWithIV = crypto.createDecipheriv(
            this.options.algorithm,
            actualKey,
            ivBuffer
        );

        // Add auth tag if present
        if (encryptedObj.authTag) {
            const authTagBuffer = Buffer.from(encryptedObj.authTag, this.options.outputEncoding);
            decipherWithIV.setAuthTag(authTagBuffer);
        }

        let decrypted = decipherWithIV.update(encryptedObj.data, this.options.outputEncoding, this.options.dataEncoding);
        decrypted += decipherWithIV.final(this.options.dataEncoding);

        return decrypted;
    }

    /**
     * Encrypt sensitive fields in an object
     */
    encryptObject(obj, sensitiveFields) {
        const result = { ...obj };

        for (const field of sensitiveFields) {
            if (result[field]) {
                const encrypted = this.encrypt(result[field]);
                result[field] = {
                    encrypted: true,
                    ...encrypted
                };
            }
        }

        return result;
    }

    /**
     * Decrypt sensitive fields in an object
     */
    decryptObject(obj, sensitiveFields) {
        const result = { ...obj };

        for (const field of sensitiveFields) {
            if (result[field] && result[field].encrypted) {
                result[field] = this.decrypt(result[field]);
            }
        }

        return result;
    }

    /**
     * Encrypt a file
     */
    encryptFile(inputPath, outputPath, password = null) {
        return new Promise((resolve, reject) => {
            const key = password ? this.deriveKey(password, crypto.randomBytes(this.options.saltLength)) : this.masterKey;
            const iv = crypto.randomBytes(this.options.ivLength);

            const readStream = fs.createReadStream(inputPath);
            const writeStream = fs.createWriteStream(outputPath);

            const cipher = crypto.createCipheriv(this.options.algorithm, key, iv);

            // Write IV as first bytes of file
            writeStream.write(iv);

            readStream
                .pipe(cipher)
                .pipe(writeStream)
                .on('finish', () => resolve())
                .on('error', reject);
        });
    }

    /**
     * Decrypt a file
     */
    decryptFile(inputPath, outputPath, password = null) {
        return new Promise((resolve, reject) => {
            const key = password ? this.deriveKey(password, crypto.randomBytes(this.options.saltLength)) : this.masterKey;

            const readStream = fs.createReadStream(inputPath);
            const writeStream = fs.createWriteStream(outputPath);

            // Read IV from first bytes of file
            let iv;
            let firstChunk = true;
            let decipher;

            readStream.on('data', (chunk) => {
                if (firstChunk) {
                    // Extract IV from first chunk
                    iv = chunk.slice(0, this.options.ivLength);
                    const remainingChunk = chunk.slice(this.options.ivLength);

                    decipher = crypto.createDecipheriv(this.options.algorithm, key, iv);

                    // Process remaining chunk
                    const decrypted = decipher.update(remainingChunk);
                    writeStream.write(decrypted);

                    firstChunk = false;
                } else {
                    // Process subsequent chunks
                    const decrypted = decipher.update(chunk);
                    writeStream.write(decrypted);
                }
            });

            readStream.on('end', () => {
                // Finalize decryption
                const finalChunk = decipher.final();
                writeStream.write(finalChunk);
                writeStream.end();
                resolve();
            });

            readStream.on('error', reject);
            writeStream.on('error', reject);
        });
    }

    /**
     * Generate a random salt
     */
    generateSalt() {
        return crypto.randomBytes(this.options.saltLength);
    }

    /**
     * Hash data using HMAC
     */
    hash(data, salt = null) {
        const actualSalt = salt || this.generateSalt();
        const hmac = crypto.createHmac('sha256', this.masterKey);
        hmac.update(data);
        hmac.update(actualSalt);
        return {
            hash: hmac.digest(this.options.outputEncoding),
            salt: actualSalt.toString(this.options.outputEncoding)
        };
    }

    /**
     * Verify a hash
     */
    verifyHash(data, hash, salt) {
        const computedHash = this.hash(data, Buffer.from(salt, this.options.outputEncoding));
        return crypto.timingSafeEqual(
            Buffer.from(hash, this.options.outputEncoding),
            Buffer.from(computedHash.hash, this.options.outputEncoding)
        );
    }

    /**
     * Generate RSA key pair for asymmetric encryption
     */
    generateRSAKeypair(options = {}) {
        const {
            modulusLength = 2048,
            publicKeyEncoding = {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding = {
                type: 'pkcs8',
                format: 'pem'
            }
        } = options;

        return crypto.generateKeyPairSync('rsa', {
            modulusLength,
            publicKeyEncoding,
            privateKeyEncoding
        });
    }

    /**
     * Encrypt data using RSA public key
     */
    rsaEncrypt(data, publicKey) {
        return crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            Buffer.from(data, this.options.dataEncoding)
        ).toString(this.options.outputEncoding);
    }

    /**
     * Decrypt data using RSA private key
     */
    rsaDecrypt(encryptedData, privateKey) {
        return crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            Buffer.from(encryptedData, this.options.outputEncoding)
        ).toString(this.options.dataEncoding);
    }

    /**
     * Sign data using private key
     */
    sign(data, privateKey) {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(privateKey, this.options.outputEncoding);
    }

    /**
     * Verify signature using public key
     */
    verifySignature(data, signature, publicKey) {
        const verify = crypto.createVerify('SHA256');
        verify.update(data);
        verify.end();
        return verify.verify(publicKey, signature, this.options.outputEncoding);
    }

    /**
     * Middleware for encrypting/decrypting request/response data
     */
    encryptionMiddleware(sensitiveFields = []) {
        return (req, res, next) => {
            // Store original methods
            const originalSend = res.send;

            // Override res.send to encrypt sensitive response data
            res.send = function (body) {
                if (typeof body === 'object' && body !== null) {
                    const encryptedBody = this.encryptObject(body, sensitiveFields);
                    return originalSend.call(this, encryptedBody);
                }
                return originalSend.call(this, body);
            }.bind(this);

            // Decrypt sensitive request data
            if (req.body && typeof req.body === 'object') {
                req.body = this.decryptObject(req.body, sensitiveFields);
            }

            next();
        };
    }

    /**
     * Field-level encryption for database records
     */
    encryptRecord(record, fieldConfig) {
        const result = { ...record };

        for (const [field, config] of Object.entries(fieldConfig)) {
            if (result[field]) {
                // Use specific key if provided in config, otherwise use master key
                const key = config.key ? this.deriveKey(config.key, config.salt || this.generateSalt()) : null;
                const encrypted = this.encrypt(result[field], key);

                // Store encrypted data with metadata
                result[field] = {
                    encrypted: true,
                    data: encrypted.data,
                    iv: encrypted.iv,
                    authTag: encrypted.authTag,
                    algorithm: encrypted.algorithm,
                    // Store key identifier if using specific keys
                    keyId: config.keyId || 'master'
                };
            }
        }

        return result;
    }

    /**
     * Field-level decryption for database records
     */
    decryptRecord(record, fieldConfig) {
        const result = { ...record };

        for (const [field, config] of Object.entries(fieldConfig)) {
            if (result[field] && result[field].encrypted) {
                // Retrieve appropriate key based on keyId
                let key = null;
                if (config.keyId && config.keyId !== 'master') {
                    key = this.deriveKey(config.key, config.salt || this.generateSalt());
                }

                result[field] = this.decrypt(result[field], key);
            }
        }

        return result;
    }

    /**
     * Rotate encryption keys
     */
    rotateKey(oldKey, newKey) {
        // This would typically involve re-encrypting data with the new key
        // Implementation depends on specific use case
        console.warn('Key rotation functionality would require re-encrypting all data');
        return { rotated: true };
    }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = {
    EncryptionService,
    encryptionService,
    encrypt: encryptionService.encrypt.bind(encryptionService),
    decrypt: encryptionService.decrypt.bind(encryptionService),
    encryptObject: encryptionService.encryptObject.bind(encryptionService),
    decryptObject: encryptionService.decryptObject.bind(encryptionService),
    encryptFile: encryptionService.encryptFile.bind(encryptionService),
    decryptFile: encryptionService.decryptFile.bind(encryptionService),
    hash: encryptionService.hash.bind(encryptionService),
    verifyHash: encryptionService.verifyHash.bind(encryptionService),
    generateRSAKeypair: encryptionService.generateRSAKeypair.bind(encryptionService),
    rsaEncrypt: encryptionService.rsaEncrypt.bind(encryptionService),
    rsaDecrypt: encryptionService.rsaDecrypt.bind(encryptionService),
    sign: encryptionService.sign.bind(encryptionService),
    verifySignature: encryptionService.verifySignature.bind(encryptionService),
    encryptionMiddleware: encryptionService.encryptionMiddleware.bind(encryptionService),
    encryptRecord: encryptionService.encryptRecord.bind(encryptionService),
    decryptRecord: encryptionService.decryptRecord.bind(encryptionService)
};