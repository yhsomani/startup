/**
 * Messaging Service Unit Tests
 */

const MessagingService = require("../messaging-service");

describe("MessagingService", () => {
    let service;

    beforeEach(() => {
        service = new MessagingService({ port: 0 });
    });

    afterEach(() => {
        if (service.server) {
            service.server.close();
        }
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            expect(service.options.port).toBe(0);
            expect(service.options.path).toBe("/ws/messages");
            expect(service.options.maxPayload).toBe(1024 * 1024);
        });

        it("should initialize with custom options", () => {
            const customService = new MessagingService({
                port: 8081,
                path: "/custom/path",
                maxPayload: 2048 * 1024,
            });
            expect(customService.options.port).toBe(8081);
            expect(customService.options.path).toBe("/custom/path");
            expect(customService.options.maxPayload).toBe(2048 * 1024);
        });

        it("should initialize empty maps", () => {
            expect(service.clients).toBeInstanceOf(Map);
            expect(service.rooms).toBeInstanceOf(Map);
            expect(service.messages).toBeInstanceOf(Map);
        });
    });

    describe("userHasAccessToRoom", () => {
        it("should return true by default", () => {
            expect(service.userHasAccessToRoom("user1", "room1")).toBe(true);
        });
    });

    describe("handleAuthenticate", () => {
        it("should emit clientConnected event", () => {
            const callback = jest.fn();
            service.on("clientConnected", callback);
            service.handleAuthenticate("client-id", "user1");
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("handleJoinRoom", () => {
        it("should not join room without authentication", () => {
            service.handleJoinRoom("non-existent", "room1");
            expect(service.rooms.size).toBe(0);
        });
    });

    describe("handleLeaveRoom", () => {
        it("should handle leaving non-existent client", () => {
            expect(() => {
                service.handleLeaveRoom("non-existent", "room1");
            }).not.toThrow();
        });
    });

    describe("getStats", () => {
        it("should return service statistics", () => {
            const stats = service.getStats();
            expect(stats).toBeDefined();
            expect(stats.clients).toBe(0);
            expect(stats.rooms).toBe(0);
        });
    });
});
