import { injectable, inject } from "inversify";
import { TYPES } from "../../../core/types";
import { Result } from "../../../core/Result";
import { Logger } from "../../../utils/logger/Logger";

@injectable()
export class HttpClient {
    async get<T>(url: string, headers?: any): Promise<Result<T>> {
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...headers
                }
            });

            if (!response.ok) {
                const text = await response.text();
                return Result.fail(`HTTP GET failed: ${response.status} - ${text}`);
            }

            const data = await response.json();
            return Result.ok(data as T);
        } catch (error: any) {
            new Logger("Legacy").error(`HttpClient GET Exception: ${error.message}`);
            return Result.fail(error.message);
        }
    }

    async post<T>(url: string, data: any, headers?: any): Promise<Result<T>> {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...headers
                },
                body: JSON.stringify(data)
            });

            const text = await response.text();

            if (!response.ok) {
                return Result.fail(`HTTP POST failed: ${response.status} - ${text}`);
            }

            let resultData;
            try {
                resultData = JSON.parse(text);
            } catch (e) {
                resultData = text;
            }

            return Result.ok(resultData as T);
        } catch (error: any) {
            new Logger("Legacy").error(`HttpClient POST Exception: ${error.message}`);
            return Result.fail(error.message);
        }
    }
}
