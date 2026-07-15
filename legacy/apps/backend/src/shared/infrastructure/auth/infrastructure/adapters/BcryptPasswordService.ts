import type { IPasswordService } from "../../domain";

export class BcryptPasswordService implements IPasswordService {
    async hash(plainText: string): Promise<string> {
        return await Bun.password.hash(plainText);
    }

    async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await Bun.password.verify(plainPassword, hashedPassword);
    }
}
