/**
 * Contract Tests - Consumer (Frontend) Side
 *
 * These tests verify that the frontend correctly expects
 * the contract from backend services.
 */

const { pactWith } = require("jest-pact");
const axios = require("axios");

const { Given, When, Then } = require("@cucumber/cucumber");

pactWith(
    {
        consumer: "ts-mfe-shell",
        provider: "auth-service",
        logDir: "../logs/pact",
        dir: "../pacts",
    },
    provider => {
        describe("Auth Service API", () => {
            beforeEach(() => {
                provider.addInteraction({
                    state: "user is not authenticated",
                    uponReceiving: "a request to login",
                    withRequest: {
                        method: "POST",
                        path: "/api/v1/auth/login",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: {
                            email: "test@example.com",
                            password: "password123",
                        },
                    },
                    willRespondWith: {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: {
                            token: "jwt-token-here",
                            user: {
                                id: "user-uuid",
                                email: "test@example.com",
                                first_name: "Test",
                                last_name: "User",
                            },
                        },
                    },
                });
            });

            test("login returns token and user", async () => {
                const response = await axios.post(
                    `${provider.mockService.baseUrl}/api/v1/auth/login`,
                    {
                        email: "test@example.com",
                        password: "password123",
                    }
                );

                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty("token");
                expect(response.data.user).toHaveProperty("id");
            });

            describe("GET /api/v1/users/me", () => {
                beforeEach(() => {
                    provider.addInteraction({
                        state: "user is authenticated",
                        uponReceiving: "a request for current user",
                        withRequest: {
                            method: "GET",
                            path: "/api/v1/users/me",
                            headers: {
                                Authorization: "Bearer valid-token",
                            },
                        },
                        willRespondWith: {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: {
                                id: "user-uuid",
                                email: "test@example.com",
                                first_name: "Test",
                                last_name: "User",
                                is_premium: false,
                                created_at: "2024-01-01T00:00:00Z",
                            },
                        },
                    });
                });

                test("returns current user data", async () => {
                    const response = await axios.get(
                        `${provider.mockService.baseUrl}/api/v1/users/me`,
                        {
                            headers: { Authorization: "Bearer valid-token" },
                        }
                    );

                    expect(response.status).toBe(200);
                    expect(response.data).toMatchObject({
                        id: expect.any(String),
                        email: expect.any(String),
                    });
                });
            });

            describe("GET /api/v1/jobs", () => {
                beforeEach(() => {
                    provider.addInteraction({
                        state: "jobs exist",
                        uponReceiving: "a request for job listings",
                        withRequest: {
                            method: "GET",
                            path: "/api/v1/jobs",
                            query: "page=1&limit=10",
                        },
                        willRespondWith: {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: {
                                data: [
                                    {
                                        id: "job-uuid-1",
                                        title: "Software Engineer",
                                        company: { id: "company-uuid", name: "Tech Corp" },
                                    },
                                ],
                                pagination: {
                                    page: 1,
                                    limit: 10,
                                    total: 100,
                                    total_pages: 10,
                                },
                            },
                        },
                    });
                });

                test("returns paginated jobs", async () => {
                    const response = await axios.get(
                        `${provider.mockService.baseUrl}/api/v1/jobs?page=1&limit=10`
                    );

                    expect(response.status).toBe(200);
                    expect(response.data).toHaveProperty("data");
                    expect(response.data).toHaveProperty("pagination");
                });
            });
        });
    }
);
