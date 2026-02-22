/**
 * Contract Tests - Provider (Backend) Verification
 *
 * Verifies that the backend services adhere to contracts
 * defined by consumers.
 */

const path = require("path");
const { Verifier } = require("@pact-foundation/pact");

const opts = {
    provider: "auth-service",
    providerBaseUrl: "http://localhost:3001",
    pactUrls: [path.join(__dirname, "../pacts/ts-mfe-shell-auth-service.json")],
    logLevel: "INFO",
    publishVerificationResults: true,
    providerVersion: "1.0.0",
};

async function runContractTests() {
    const verifier = new Verifier(opts);

    try {
        const result = await verifier.verifyProvider();
        console.log("Contract verification successful!");
        console.log(result);
        process.exit(0);
    } catch (error) {
        console.error("Contract verification failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    runContractTests();
}

module.exports = { runContractTests };
