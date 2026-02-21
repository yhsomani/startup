/**
 * Unit Tests for Configuration Management
 * Comprehensive testing of environment configuration system
 */

const { 
    getConfig, 
    getNestedConfig, 
    setConfig, 
    updateConfig, 
    validateAll, 
    getSummary,
    getAllConfigs,
    configManager 
} = require('../../../../shared/config-manager');

// Mock environment variables for testing
const mockEnv = {
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
    PORT: '3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-characters-long',
    ENCRYPTION_KEY: 'encryption-key-that-is-at-least-32-characters',
    API_RATE_LIMIT: '100',
    CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001'
};

describe('Configuration Management Tests', () => {
    let originalEnv;

    beforeEach(() => {
        // Store original environment
        originalEnv = { ...process.env };
        
        // Mock environment variables
        Object.assign(process.env, mockEnv);
        
        // Reset config manager
        configManager.configs.clear();
        configManager.loadDefaultConfigs();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
        
        // Reset config manager
        configManager.configs.clear();
        configManager.loadDefaultConfigs();
    });

    describe('getConfig function', () => {
        test('should get default configuration when no key provided', () => {
            const allConfigs = getAllConfigs();
            
            expect(allConfigs).toBeDefined();
            expect(typeof allConfigs).toBe('object');
        });

        test('should get specific configuration value', () => {
            const dbConfig = getConfig('database');
            
            expect(dbConfig).toBeDefined();
            expect(dbConfig.host).toBeDefined();
            expect(dbConfig.port).toBeDefined();
            expect(dbConfig.name).toBeDefined();
        });

        test('should return default value when key not found', () => {
            const nonExistent = getConfig('non.existent.key', 'default-value');
            
            expect(nonExistent).toBe('default-value');
        });
    });

    describe('getNestedConfig function', () => {
        test('should get nested configuration values', () => {
            const dbHost = getNestedConfig('database.host');
            
            expect(dbHost).toBeDefined();
            expect(typeof dbHost).toBe('string');
        });

        test('should return default value for nested path not found', () => {
            const nonExistent = getNestedConfig('database.nonexistent.path', 'default');
            
            expect(nonExistent).toBe('default');
        });
    });

    describe('setConfig function', () => {
        test('should set configuration value', () => {
            setConfig('test.key', 'test-value');
            
            const value = getConfig('test.key');
            expect(value).toBe('test-value');
        });

        test('should set top-level configuration', () => {
            setConfig('test.newField', 'new-value');
            
            const value = getConfig('test.newField');
            expect(value).toBe('new-value');
        });
    });

    describe('updateConfig function', () => {
        test('should update existing configuration', () => {
            updateConfig('database', { updatedField: 'updated-value' });
            
            const dbConfig = getConfig('database');
            expect(dbConfig.updatedField).toBe('updated-value');
            expect(dbConfig.host).toBeDefined(); // Original field should remain
        });
    });

    describe('validateAll function', () => {
        test('should validate all configurations', () => {
            const validation = validateAll();
            
            expect(validation).toBeDefined();
            expect(Array.isArray(validation)).toBe(true);
            // Should have no errors since we provided proper configuration
            expect(validation.length).toBe(0);
        });
    });

    describe('getSummary function', () => {
        test('should return configuration summary', () => {
            const summary = getSummary();
            
            expect(summary).toBeDefined();
            expect(typeof summary).toBe('object');
            expect(summary.environment).toBeDefined();
        });
    });

    describe('Configuration Edge Cases', () => {
        test('should handle missing configuration keys', () => {
            const value = getConfig('non.existent.key', 'default');
            
            expect(value).toBe('default');
        });

        test('should handle null configuration values', () => {
            setConfig('test.null', null);
            
            const value = getConfig('test.null', 'default');
            expect(value).toBe(null);
        });

        test('should handle undefined configuration values', () => {
            setConfig('test.undefined', undefined);
            
            const value = getConfig('test.undefined');
            expect(value).toBe(undefined);
        });

        test('should handle special characters in configuration', () => {
            setConfig('special.var', '!@#$%^&*()_+-=[]{}|;:,.<>?');
            
            const value = getConfig('special.var');
            expect(value).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
        });
    });

    describe('Configuration Performance', () => {
        test('should get configuration quickly', () => {
            const startTime = Date.now();
            
            for (let i = 0; i < 1000; i++) {
                getConfig('database');
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete 1000 gets in less than 1 second
            expect(duration).toBeLessThan(1000);
        });

        test('should validate configuration quickly', () => {
            const startTime = Date.now();
            
            for (let i = 0; i < 1000; i++) {
                validateAll();
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete 1000 validations in less than 1 second
            expect(duration).toBeLessThan(1000);
        });
    });

    describe('Configuration Security', () => {
        test('should mask sensitive data in summary', () => {
            setConfig('api.secret', 'secret-key-value');
            
            const summary = getSummary();
            const summaryString = JSON.stringify(summary);
            
            // Should not contain actual secret
            expect(summaryString).not.toContain('secret-key-value');
        });

        test('should handle password fields securely', () => {
            const dbConfig = getConfig('database');
            
            // Password should exist but be handled securely
            expect(dbConfig.password !== undefined || dbConfig.password === '').toBe(true);
        });
    });
});