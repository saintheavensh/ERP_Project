import type { IUserRepository } from "../../domain";

export interface LogoutInput {
    sessionId: string;
}

export class LogoutUseCase {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: LogoutInput): Promise<void> {
        if (!input.sessionId) {
            throw new Error("Session ID is required to logout");
        }
        await this.userRepository.deactivateSession(input.sessionId);
    }
}
