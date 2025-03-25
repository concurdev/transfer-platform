import request from "supertest";
import app from "../src/app.js";

describe("Transfer API", () => {
  it("should create a transfer and return transferId", async () => {
    const response = await request(app)
      .post("/api/transfer")
      .send({
        sender: "0xf05249C12f02AA6B7D3A62AeC852AFFB19a6e3Fc",
        recipient: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        token: { amount: 10 },
        signature:
          "0xc8e15648b632775fdd2c1e7a6b4ec357ceb5489fe974a7ea39991c90057b71da2258cf952120904e664cdfcc4ca89e6a56bdd6db38ff617f186f98d9a10b59cd1b", // Ensure signature format is correct
      });

    // Assert the response status
    expect(response.status).toBe(200);

    // Assert response body structure
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Transfer executed");

    expect(response.body.transferId).toBeDefined();
  });

  it("should get transfer status", async () => {
    const transferId = "8cd0cae5-e8d0-4b12-8f7d-07d364d6e0cb";

    const response = await request(app).get(`/api/transfer/status/${transferId}`);

    // Assert the response status
    expect(response.status).toBe(200);

    // Assert the response contains the correct transferId and status
    expect(response.body.transferId).toBe(transferId);
    expect(response.body.status).toBe("pending");
  });
});
