import { describe, it, expect, beforeEach } from 'vitest';
import { featureFlags } from '@/config/featureFlags';

describe('Feature Flags', () => {
    beforeEach(() => {
        featureFlags.clearOverrides();
        localStorage.clear();
    });

    describe('isEnabled', () => {
        it('should return default value when no override set', () => {
            expect(featureFlags.isEnabled('CERTIFICATE_GENERATION')).toBe(true);
            expect(featureFlags.isEnabled('REALTIME_NOTIFICATIONS')).toBe(false);
        });

        it('should return false for unknown flags', () => {
            expect(featureFlags.isEnabled('UNKNOWN_FLAG')).toBe(false);
        });

        it('should respect override when set', () => {
            featureFlags.setOverride('REALTIME_NOTIFICATIONS', true);
            expect(featureFlags.isEnabled('REALTIME_NOTIFICATIONS')).toBe(true);
        });

        it('should respect localStorage override', () => {
            localStorage.setItem('ff_REALTIME_NOTIFICATIONS', 'true');
            expect(featureFlags.isEnabled('REALTIME_NOTIFICATIONS')).toBe(true);
        });
    });

    describe('setOverride', () => {
        it('should override default value', () => {
            expect(featureFlags.isEnabled('CERTIFICATE_GENERATION')).toBe(true);
            featureFlags.setOverride('CERTIFICATE_GENERATION', false);
            expect(featureFlags.isEnabled('CERTIFICATE_GENERATION')).toBe(false);
        });
    });

    describe('clearOverrides', () => {
        it('should reset to defaults', () => {
            featureFlags.setOverride('REALTIME_NOTIFICATIONS', true);
            expect(featureFlags.isEnabled('REALTIME_NOTIFICATIONS')).toBe(true);

            featureFlags.clearOverrides();
            expect(featureFlags.isEnabled('REALTIME_NOTIFICATIONS')).toBe(false);
        });
    });

    describe('getAllFlags', () => {
        it('should return all flag definitions', () => {
            const flags = featureFlags.getAllFlags();
            expect(Object.keys(flags).length).toBeGreaterThan(0);
            expect(flags.CERTIFICATE_GENERATION).toBeDefined();
        });
    });

    describe('getStatus', () => {
        it('should return status of all flags', () => {
            const status = featureFlags.getStatus();
            expect(typeof status.CERTIFICATE_GENERATION).toBe('boolean');
            expect(typeof status.REALTIME_NOTIFICATIONS).toBe('boolean');
        });
    });
});
