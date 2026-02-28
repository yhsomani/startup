/**
 * Video Service Unit Tests
 */

const EventEmitter = require("events");

describe("VideoInterviewService", () => {
    let VideoInterviewService;
    let service;

    beforeEach(() => {
        jest.resetModules();
        VideoInterviewService = require("../video-interview-service");
        service = new VideoInterviewService({
            port: 0,
            enableRecording: true,
            maxParticipants: 10,
        });
    });

    afterEach(() => {
        if (service.server) {
            service.server.close();
        }
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            const defaultService = new VideoInterviewService();
            expect(defaultService.options.port).toBe(0);
            expect(defaultService.options.enableRecording).toBe(false);
            expect(defaultService.options.maxParticipants).toBe(2);
        });

        it("should initialize with custom options", () => {
            expect(service.options.enableRecording).toBe(true);
            expect(service.options.maxParticipants).toBe(10);
        });

        it("should extend EventEmitter", () => {
            expect(service).toBeInstanceOf(EventEmitter);
        });
    });

    describe("initialize", () => {
        it("should create HTTP server and WebSocket server", async () => {
            await service.initialize();
            expect(service.server).toBeDefined();
            expect(service.wss).toBeDefined();
        });
    });

    describe("handleConnection", () => {
        it("should handle new WebSocket connection", () => {
            const mockWs = {
                send: jest.fn(),
                on: jest.fn(),
                close: jest.fn(),
            };
            const mockReq = { url: "/ws/interview" };

            service.handleConnection(mockWs, mockReq);
            expect(mockWs.on).toHaveBeenCalledWith("message", expect.any(Function));
            expect(mockWs.on).toHaveBeenCalledWith("close", expect.any(Function));
        });
    });

    describe("handleMessage", () => {
        it("should handle join-room message", () => {
            const mockWs = {
                send: jest.fn(),
                readyState: 1,
            };
            const clientId = "test-client";
            service.clients.set(clientId, { ws: mockWs, roomId: null });

            const message = JSON.stringify({
                type: "join-room",
                roomId: "interview-1",
            });

            service.handleMessage(clientId, message);
            expect(mockWs.send).toHaveBeenCalled();
        });

        it("should handle leave-room message", () => {
            const mockWs = {
                send: jest.fn(),
                readyState: 1,
            };
            const clientId = "test-client";
            service.clients.set(clientId, { ws: mockWs, roomId: "interview-1" });
            service.rooms.set("interview-1", {
                id: "interview-1",
                participants: new Set([clientId]),
            });

            const message = JSON.stringify({
                type: "leave-room",
            });

            service.handleMessage(clientId, message);
            expect(mockWs.send).toHaveBeenCalled();
        });

        it("should handle unknown message type", () => {
            const mockWs = {
                send: jest.fn(),
                readyState: 1,
            };
            const clientId = "test-client";
            service.clients.set(clientId, { ws: mockWs, roomId: null });

            const message = JSON.stringify({
                type: "unknown-type",
            });

            expect(() => {
                service.handleMessage(clientId, message);
            }).not.toThrow();
        });
    });

    describe("broadcastToRoom", () => {
        it("should broadcast message to all participants", () => {
            const mockWs1 = { send: jest.fn(), readyState: 1 };
            const mockWs2 = { send: jest.fn(), readyState: 1 };

            service.clients.set("client1", { ws: mockWs1, roomId: "room1" });
            service.clients.set("client2", { ws: mockWs2, roomId: "room1" });
            service.rooms.set("room1", {
                id: "room1",
                participants: new Set(["client1", "client2"]),
            });

            service.broadcastToRoom("room1", { type: "test", message: "hello" });

            expect(mockWs1.send).toHaveBeenCalled();
            expect(mockWs2.send).toHaveBeenCalled();
        });
    });

    describe("getRoomInfo", () => {
        it("should return room information", () => {
            service.rooms.set("room1", {
                id: "room1",
                participants: new Set(["client1", "client2"]),
            });

            const info = service.getRoomInfo("room1");
            expect(info).toBeDefined();
            expect(info.id).toBe("room1");
        });

        it("should return null for non-existent room", () => {
            const info = service.getRoomInfo("non-existent");
            expect(info).toBeNull();
        });
    });

    describe("getStats", () => {
        it("should return service statistics", () => {
            const stats = service.getStats();
            expect(stats).toBeDefined();
            expect(stats.activeConnections).toBe(0);
            expect(stats.activeRooms).toBe(0);
        });
    });
});
