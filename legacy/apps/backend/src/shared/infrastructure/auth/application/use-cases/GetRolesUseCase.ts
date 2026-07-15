import type { IRoleRepository, Role } from "../../domain";
import { DBContext } from "../../../../types/db-context";

export class GetRolesUseCase {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(dbOrTx?: DBContext): Promise<Role[]> {
        return await this.roleRepository.findAll(dbOrTx);
    }
}
