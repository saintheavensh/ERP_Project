/**
 * Port for password verification. Use cases depend on this, not on Bun.password.
 */

export interface IPasswordService {
    hash(plainText: string): Promise<string>;
    verify(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
