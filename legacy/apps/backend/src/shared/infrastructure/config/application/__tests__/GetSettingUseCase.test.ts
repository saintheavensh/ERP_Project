import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetSettingUseCase } from "../use-cases/GetSettingUseCase";
import { Result } from "../../../../core/Result";
import { Setting } from "../../domain/entities/Setting.entity";

describe("GetSettingUseCase", () => {
    let useCase: GetSettingUseCase;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            findByKey: vi.fn(),
            findByScope: vi.fn(),
            save: vi.fn(),
            delete: vi.fn()
        };
        useCase = new GetSettingUseCase(mockRepo);
    });

    it("should return the setting value if found", async () => {
        const mockSetting = Setting.create({ key: "theme", value: "dark", type: "string", scope: "system", isEditable: true }).getValue();
        mockRepo.findByKey.mockResolvedValue(Result.ok(mockSetting));

        const result = await useCase.execute({ key: "theme", scope: "system" });

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toBe("dark");
        expect(mockRepo.findByKey).toHaveBeenCalledWith("theme", "system", undefined);
    });

    it("should return default value if setting not found and default is provided", async () => {
        mockRepo.findByKey.mockResolvedValue(Result.fail("Not found"));

        const result = await useCase.execute({ key: "theme", scope: "system", defaultValue: "light" });

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toBe("light");
    });

    it("should return failure if setting not found and no default provided", async () => {
        mockRepo.findByKey.mockResolvedValue(Result.fail("Not found"));

        const result = await useCase.execute({ key: "theme", scope: "system" });

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Not found");
    });
});
