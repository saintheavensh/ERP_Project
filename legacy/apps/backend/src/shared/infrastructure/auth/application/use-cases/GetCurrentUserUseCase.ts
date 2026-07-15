import type { IUserRepository, UserWithRoles } from "../../domain";

export interface GetCurrentUserInput {
    userId: string;
    dbOrTx?: unknown;
}

export interface GetCurrentUserResult {
    user: Omit<UserWithRoles, "password" | "roles"> & { role: string; roles: string[] };
}

export class GetCurrentUserUseCase {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: GetCurrentUserInput): Promise<GetCurrentUserResult | null> {
        const user = await this.userRepository.findById(input.userId, input.dbOrTx);
        if (!user) return null;

        let userRoles = (user as UserWithRoles).roles?.map((ur: { role: { id: string } }) => ur.role.id) || [];
        if (userRoles.length === 0 && user.role) {
            userRoles = [user.role];
        }
        const { password: _p, ...userWithoutPassword } = user;

        return {
            user: {
                ...userWithoutPassword,
                role: userRoles.includes("owner") ? "owner" : userRoles[0],
                roles: userRoles
            }
        };
    }
}
