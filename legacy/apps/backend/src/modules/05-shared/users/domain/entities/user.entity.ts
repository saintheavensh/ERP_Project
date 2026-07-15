export interface Role {
    id: string;
    name: string;
    label?: string | null;
}

export interface UserRole {
    userId: string;
    roleId: string;
    role?: Role;
}

export interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
    roles?: UserRole[];
    createdAt: Date;
    updatedAt?: Date | null;
}

export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'roles'> & {
    roles?: string[];
};

export type UpdateUserData = Partial<CreateUserData>;
