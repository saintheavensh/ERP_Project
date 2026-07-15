/**
 * Wires auth ports to adapters and exposes use cases.
 * Single place to swap implementations (e.g. for testing).
 */
import { LoginUseCase } from "./application/use-cases/LoginUseCase";
import { GetCurrentUserUseCase } from "./application/use-cases/GetCurrentUserUseCase";
import { GetRolesUseCase } from "./application/use-cases/GetRolesUseCase";
import { SwitchRoleUseCase } from "./application/use-cases/SwitchRoleUseCase";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshTokenUseCase";
import { LogoutUseCase } from "./application/use-cases/LogoutUseCase";
import { GetRolePermissionsUseCase } from "./application/use-cases/GetRolePermissionsUseCase";
import {
    DrizzleAuthRepository,
} from "./infrastructure/persistence/DrizzleAuthRepository";
import {
    DrizzleRoleRepository,
} from "./infrastructure/persistence/DrizzleRoleRepository";
import { BcryptPasswordService } from "./infrastructure/adapters/BcryptPasswordService";
import { JwtTokenService } from "./infrastructure/adapters/JwtTokenService";
import { AuthFacade } from "./application/facades/AuthFacade";

// Repositories & Adapters
export const userRepository = new DrizzleAuthRepository(); // Exported for the Facade to use later
const passwordVerifier = new BcryptPasswordService();
const tokenIssuer = new JwtTokenService();
const roleRepository = new DrizzleRoleRepository();

// Use Cases
export const loginUseCase = new LoginUseCase(userRepository, passwordVerifier, tokenIssuer);
export const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
export const getRolesUseCase = new GetRolesUseCase(roleRepository);
export const switchRoleUseCase = new SwitchRoleUseCase(userRepository, tokenIssuer);
export const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, tokenIssuer, passwordVerifier);
export const logoutUseCase = new LogoutUseCase(userRepository);
export const getRolePermissionsUseCase = new GetRolePermissionsUseCase();

/**
 * Auth Facade - Standard entry point for the module
 */
export const authFacade = new AuthFacade(
    loginUseCase,
    getCurrentUserUseCase,
    getRolesUseCase,
    userRepository,
    getRolePermissionsUseCase
);
