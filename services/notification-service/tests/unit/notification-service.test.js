/**
 * Notification Service Unit Tests
 */

const NotificationService = require("../index");

describe("NotificationService", () => {
    let service;

    beforeEach(() => {
        service = new NotificationService({ port: 0 });
    });

    afterEach(() => {
        if (service.server) {
            service.server.close();
        }
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            expect(service.options.port).toBe(0);
            expect(service.options.path).toBe("/ws/notifications");
            expect(service.options.maxPayload).toBe(1024 * 1024);
        });

        it("should initialize with custom options", () => {
            const customService = new NotificationService({
                port: 8080,
                path: "/custom/path",
            });
            expect(customService.options.port).toBe(8080);
            expect(customService.options.path).toBe("/custom/path");
        });

        it("should initialize empty maps", () => {
            expect(service.clients).toBeInstanceOf(Map);
            expect(service.subscriptions).toBeInstanceOf(Map);
            expect(service.topics).toBeInstanceOf(Map);
        });
    });

    describe("sendToUser", () => {
        it("should emit notification event", () => {
            const callback = jest.fn();
            service.on("notification", callback);
            service.sendToUser("user1", { type: "test", message: "Hello" });
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("sendToTopic", () => {
        it("should emit topic notification event", () => {
            const callback = jest.fn();
            service.on("topicNotification", callback);
            service.sendToTopic("jobs", { type: "new_job" });
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("broadcast", () => {
        it("should emit broadcast event", () => {
            const callback = jest.fn();
            service.on("broadcast", callback);
            service.broadcast({ type: "announcement" });
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("getStats", () => {
        it("should return service statistics", () => {
            const stats = service.getStats();
            expect(stats).toBeDefined();
            expect(stats.clients).toBe(0);
            expect(stats.topics).toBe(0);
        });
    });
});
