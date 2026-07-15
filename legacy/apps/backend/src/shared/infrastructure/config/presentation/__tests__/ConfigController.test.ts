import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfigController } from "../controllers/ConfigController";
import { ConfigFacade } from "../../application/facades/ConfigFacade";
import { Result } from "../../../../core/Result";
import { Context } from "hono";

describe("ConfigController", () => {
    let controller: ConfigController;
    let mockFacade: any;

    beforeEach(() => {
        mockFacade = {
            getSystemConfig: vi.fn(),
            updateSetting: vi.fn(),
        };
        controller = new ConfigController(mockFacade as unknown as ConfigFacade);
    });

    const createMockContext = (paramKey: string, queryDefault?: string, body?: any) => {
        return {
            req: {
                param: (k: string) => paramKey,
                query: (k: string) => queryDefault,
                json: vi.fn().mockResolvedValue(body)
            },
            json: vi.fn().mockImplementation((val, status = 200) => ({ body: val, status }))
        } as unknown as Context;
    };

    it("should get system config successfully", async () => {
        mockFacade.getSystemConfig.mockResolvedValue(Result.ok("dark"));
        const c = createMockContext("theme");

        const response = await controller.getSystemConfig(c) as any;

        expect(c.json).toHaveBeenCalledWith({ data: "dark", message: "Success" });
        expect(response.status).toBe(200);
    });

    it("should return 404 if config not found", async () => {
        mockFacade.getSystemConfig.mockResolvedValue(Result.fail("Setting unknown not found"));
        const c = createMockContext("unknown");

        const response = await controller.getSystemConfig(c) as any;

        expect(c.json).toHaveBeenCalledWith({ error: "Setting unknown not found" }, 404);
        expect(response.status).toBe(404);
    });

    it("should update config successfully", async () => {
        mockFacade.updateSetting.mockResolvedValue(Result.ok());
        const c = createMockContext("theme", undefined, { value: "light", type: "string" });

        const response = await controller.updateConfig(c) as any;

        expect(c.json).toHaveBeenCalledWith({ data: "light", message: "Setting updated successfully" });
        expect(response.status).toBe(200);
    });
});
