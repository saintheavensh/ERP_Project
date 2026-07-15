/**
 * Brand entity type
 */
export interface Brand {
    id: string;       // e.g., "samsung"
    name: string;     // e.g., "Samsung Electronics"
    logo?: string;
    createdAt?: string;
}

/**
 * Brand form data for create/edit operations
 */
export interface BrandFormData {
    id: string;
    name: string;
    logo: string;
}

/**
 * Brand creation payload
 */
export interface CreateBrandPayload {
    id: string;
    name: string;
    logo?: string;
}

/**
 * Brand update payload
 */
export interface UpdateBrandPayload {
    name?: string;
    logo?: string;
}
