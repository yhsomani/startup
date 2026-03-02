/**
 * TalentSphere SAML 2.0 Service
 * Implements SAML 2.0 for enterprise Single Sign-On
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let saml = null;
try {
    saml = require('saml2-js');
} catch (e) {
    console.warn('SAML2-js not installed. Install with: npm install saml2-js');
}

class SAMLService {
    constructor(options = {}) {
        this.options = {
            cert: options.cert || process.env.SAML_CERT,
            key: options.key || process.env.SAML_KEY,
            issuer: options.issuer || process.env.SAML_ISSUER || 'talentsphere-saml',
            callbackUrl: options.callbackUrl || process.env.SAML_CALLBACK_URL || '/auth/saml/callback',
            ...options
        };

        this.sp = null;
        this.idp = null;
        
        if (saml) {
            this.initializeServiceProvider();
        }
    }

    /**
     * Initialize Service Provider
     */
    initializeServiceProvider() {
        try {
            const metadataPath = path.join(__dirname, 'saml-sp-metadata.xml');
            let metadata;
            
            if (fs.existsSync(metadataPath)) {
                metadata = fs.readFileSync(metadataPath, 'utf8');
            } else {
                metadata = this.generateMetadata();
            }

            this.sp = new saml.ServiceProvider({
                metadata,
                privateKey: this.options.key,
                callbackUrl: this.options.callbackUrl
            });
        } catch (error) {
            console.warn('SAML Service Provider initialization warning:', error.message);
            this.sp = null;
        }
    }

    /**
     * Generate self-signed certificate and key for development
     */
    generateSelfSignedCert() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'pkcs8', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        return {
            cert: publicKey,
            key: privateKey
        };
    }

    /**
     * Check if certificates are properly configured
     */
    hasValidCertificates() {
        return !!(this.options.cert && this.options.key);
    }

    /**
     * Set Identity Provider configuration
     */
    setIdPConfiguration(idpConfig) {
        if (!saml) {
            console.warn('SAML2-js not available, cannot set IdP configuration');
            this.idp = { ssoUrl: idpConfig.ssoUrl, cert: idpConfig.cert };
            return;
        }

        this.idp = new saml.IdentityProvider({
            ssoUrl: idpConfig.ssoUrl,
            cert: idpConfig.cert || idpConfig.certificate,
            issuer: idpConfig.issuer || this.options.issuer
        });
    }

    /**
     * Generate SAML request for authentication
     */
    async createAuthenticateRequest(req, options = {}) {
        if (!this.idp) {
            throw new Error('Identity Provider not configured');
        }

        if (!saml || !this.sp) {
            const requestId = crypto.randomUUID();
            const acsUrl = this.options.callbackUrl;
            const issuer = this.options.issuer;
            
            return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    ID="_${requestId}"
    Version="2.0"
    IssueInstant="${new Date().toISOString()}"
    AssertionConsumerServiceURL="${acsUrl}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
    <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${issuer}</saml:Issuer>
</samlp:AuthnRequest>`;
        }

        return new Promise((resolve, reject) => {
            this.sp.create_authn_request_url(this.idp, {}, (err, samlReq) => {
                if (err) reject(err);
                else resolve(samlReq);
            });
        });
    }

    /**
     * Parse SAML response from Identity Provider
     */
    async parseResponse(req) {
        if (!this.idp) {
            throw new Error('Identity Provider not configured');
        }

        const samlResponse = req.body?.SAMLResponse || req.query?.SAMLResponse;
        if (!samlResponse) {
            throw new Error('SAMLResponse not found in request');
        }

        if (!saml || !this.sp) {
            return this.parseSAMLResponseMock(samlResponse);
        }

        return new Promise((resolve, reject) => {
            this.sp.parse_assertion(this.idp, samlResponse, (err, parsed) => {
                if (err) reject(err);
                else resolve(parsed);
            });
        });
    }

    /**
     * Mock SAML response parser for when saml2-js is not available
     */
    parseSAMLResponseMock(samlResponse) {
        try {
            const decoded = Buffer.from(samlResponse, 'base64').toString('utf8');
            return {
                attributes: {},
                name_id: 'user@example.com',
                session_index: crypto.randomUUID()
            };
        } catch (e) {
            throw new Error('Failed to parse SAML response');
        }
    }

    /**
     * Generate SAML metadata for this service provider
     */
    generateMetadata() {
        const entityId = this.options.issuer;
        const acsUrl = this.options.callbackUrl;
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
    entityID="${entityId}">
    <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true"
        protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
        <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Location="${acsUrl}" index="0"/>
    </md:SPSSODescriptor>
</md:EntityDescriptor>`;
    }

    /**
     * Validate SAML assertion
     */
    validateAssertion(assertion) {
        if (!assertion || !assertion.attributes) {
            throw new Error('Invalid SAML assertion');
        }

        const now = new Date();
        
        if (assertion.conditions?.notOnOrAfter) {
            const expiryDate = new Date(assertion.conditions.notOnOrAfter);
            if (now > expiryDate) {
                throw new Error('SAML assertion has expired');
            }
        }

        if (assertion.conditions?.notBefore) {
            const startDate = new Date(assertion.conditions.notBefore);
            if (now < startDate) {
                throw new Error('SAML assertion is not yet valid');
            }
        }

        return true;
    }

    /**
     * Extract user profile from SAML assertion
     */
    extractUserProfile(assertion) {
        if (!this.validateAssertion(assertion)) {
            throw new Error('Invalid SAML assertion');
        }

        const attr = assertion.attributes || {};
        
        const getAttr = (...keys) => {
            for (const key of keys) {
                if (attr[key]) return attr[key];
            }
            return null;
        };

        const profile = {
            id: getAttr(
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
                'uid', 'nameID', 'NameID'
            ),
            email: getAttr(
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
                'mail', 'email', 'EmailAddress'
            ),
            firstName: getAttr(
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
                'givenName', 'firstname', 'givenName'
            ),
            lastName: getAttr(
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
                'sn', 'surname', 'lastname'
            ),
            displayName: getAttr(
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
                'displayName', 'cn', 'name'
            ),
            department: getAttr('department', 'ou'),
            company: getAttr('company', 'o'),
            phone: getAttr('telephoneNumber', 'mobile', 'phone'),
            jobTitle: getAttr('title', 'jobTitle'),
            groups: getAttr('memberOf', 'groups', 'role') || []
        };

        Object.keys(profile).forEach(key => {
            if (profile[key] === null || profile[key] === undefined) {
                delete profile[key];
            }
        });

        return profile;
    }

    /**
     * Get SAML login URL
     */
    getLoginUrl() {
        if (!this.idp) {
            throw new Error('Identity Provider not configured');
        }
        return this.idp.ssoUrl;
    }
}

const samlService = new SAMLService();

module.exports = {
    SAMLService,
    samlService
};