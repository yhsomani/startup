/**
 * TalentSphere SAML 2.0 Service
 * Implements SAML 2.0 for enterprise Single Sign-On
 */

const saml = require('saml2-js');
const fs = require('fs');
const path = require('path');

class SAMLPasser {
    constructor(options = {}) {
        this.options = {
            cert: options.cert || process.env.SAML_CERT || this.getDefaultCert(),
            key: options.key || process.env.SAML_KEY || this.getDefaultKey(),
            issuer: options.issuer || process.env.SAML_ISSUER || 'talentsphere-saml',
            callbackUrl: options.callbackUrl || process.env.SAML_CALLBACK_URL || '/auth/saml/callback',
            ...options
        };

        // Initialize SAML strategy
        this.sp = new saml.ServiceProvider({
            metadata: fs.readFileSync(path.join(__dirname, 'saml-sp-metadata.xml'), 'utf8'), // This would be generated
            privateKey: this.options.key,
            callbackUrl: this.options.callbackUrl
        });

        this.idp = null;
    }

    /**
     * Set Identity Provider configuration
     */
    setIdPConfiguration(idpConfig) {
        this.idp = new saml.IdentityProvider({
            ssoUrl: idpConfig.ssoUrl,
            cert: idpConfig.cert || idpConfig.certificate,
            issuer: idpConfig.issuer || this.options.issuer
        });
    }

    /**
     * Generate SAML request for authentication
     */
    createAuthenticateRequest(req, options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.idp) {
                return reject(new Error('Identity Provider not configured'));
            }

            this.sp.create_authn_request_url(this.idp, {}, (err, samlReq) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(samlReq);
                }
            });
        });
    }

    /**
     * Parse SAML response from Identity Provider
     */
    parseResponse(req) {
        return new Promise((resolve, reject) => {
            if (!this.idp) {
                return reject(new Error('Identity Provider not configured'));
            }

            const samlResponse = req.body.SAMLResponse;
            if (!samlResponse) {
                return reject(new Error('SAMLResponse not found in request'));
            }

            this.sp.parse_assertion(this.idp, samlResponse, (err, parsedAssertion) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(parsedAssertion);
                }
            });
        });
    }

    /**
     * Generate SAML metadata for this service provider
     */
    generateMetadata() {
        if (!this.idp) {
            throw new Error('Identity Provider not configured');
        }

        return this.sp.create_metadata();
    }

    /**
     * Validate SAML assertion
     */
    validateAssertion(assertion) {
        // Basic validation of SAML assertion
        if (!assertion || !assertion.attributes) {
            throw new Error('Invalid SAML assertion');
        }

        // Check if assertion is still valid (not expired)
        const now = new Date();
        if (assertion.conditions && assertion.conditions.notOnOrAfter) {
            const expiryDate = new Date(assertion.conditions.notOnOrAfter);
            if (now > expiryDate) {
                throw new Error('SAML assertion has expired');
            }
        }

        // Check if assertion is valid from a certain time
        if (assertion.conditions && assertion.conditions.notBefore) {
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

        // Map common SAML attributes to user profile
        const profile = {
            id: assertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                assertion.attributes['uid'] ||
                assertion.attributes['mail'] ||
                assertion.attributes['email'] ||
                assertion.attributes['name'] ||
                assertion.attributes['NameID'],
            email: assertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
                assertion.attributes['mail'] ||
                assertion.attributes['email'],
            firstName: assertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
                assertion.attributes['givenName'] ||
                assertion.attributes['firstname'],
            lastName: assertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] ||
                assertion.attributes['sn'] ||
                assertion.attributes['lastname'],
            displayName: assertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                assertion.attributes['displayName'] ||
                assertion.attributes['cn'] ||
                assertion.attributes['name'],
            department: assertion.attributes['department'] ||
                assertion.attributes['ou'],
            company: assertion.attributes['company'] ||
                assertion.attributes['o'],
            phone: assertion.attributes['telephoneNumber'] ||
                assertion.attributes['mobile'],
            jobTitle: assertion.attributes['title'],
            groups: assertion.attributes['memberOf'] || assertion.attributes['groups'] || []
        };

        // Clean up empty values
        Object.keys(profile).forEach(key => {
            if (!profile[key]) {
                delete profile[key];
            }
        });

        return profile;
    }

    /**
     * Generate default certificate (for development purposes)
     */
    getDefaultCert() {
        // In a real implementation, this would be a proper certificate
        // For now, returning a placeholder
        return 'PLACEHOLDER_CERT';
    }

    /**
     * Generate default private key (for development purposes)
     */
    getDefaultKey() {
        // In a real implementation, this would be a proper private key
        // For now, returning a placeholder
        return 'PLACEHOLDER_KEY';
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

// Export singleton instance
const samlService = new SAMLPasser();

module.exports = {
    SAMLPasser,
    samlService
};