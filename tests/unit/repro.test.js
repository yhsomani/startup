const ports = require('../../shared/ports');
const environment = require('../../shared/environment');
const logger = require('../../shared/logger');
const uuid = require('uuid');
const authService = require('../../backends/backend-enhanced/auth-service/index');

describe('Ports Repro', () => {
    it('should load ports', () => {
        expect(ports).toBeDefined();
        expect(environment).toBeDefined();
        expect(logger).toBeDefined();
        expect(uuid).toBeDefined();
        expect(authService).toBeDefined();

        console.log('AuthService type in Jest:', typeof authService);
        console.log('AuthService keys:', Object.keys(authService));

        // Try to instantiate
        try {
            let ServiceClass = authService;
            if (typeof authService !== 'function' && authService.default) {
                console.log('Using authService.default');
                ServiceClass = authService.default;
            }
            const service = new ServiceClass();
            expect(service).toBeDefined();
        } catch (e) {
            console.error('Instantiation failed:', e);
            throw e;
        }
    });
});
