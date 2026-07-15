# Learning Notes: The Auth Module

This guide breaks down how the Authentication module (`/src/modules/auth`) works in this project. We use a **Layered Architecture** (Route -> Controller -> Service -> Model).

---

## 1. High-Level Request Flow

When a user tries to log in, the request travels through these layers:

1.  **Client (Frontend)**: Sends `POST /auth/login` with `{ username, password }`.
2.  **Route (`auth.routes.ts`)**: Matches the URL and forwards it to the **Controller**.
3.  **Controller (`auth.controller.ts`)**: Validates input, calls the **Service**, and handles the HTTP response (setting cookies, returning JSON).
4.  **Service (`auth.service.ts`)**: The "Brain". Checks passwords, generates JWT tokens, and handles business logic.
5.  **Model (`auth.model.ts`)**: The "Data Access Layer". Runs SQL queries to find the user in the database.
6.  **Database**: Returns the user data.

---

## 2. Step-by-Step Explanation

### A. The Route Layer (`auth.routes.ts`)
This file acts as the "Traffic Cop". It defines the endpoints and directs them to the right controller method.

```typescript
// Define the Hono app
const app = new Hono();
const controller = new AuthController();

// Map URL paths to Controller functions
app.post("/login", (c) => controller.login(c));
app.post("/logout", (c) => controller.logout(c));

// Protected Route: Uses 'authMiddleware' before reaching the controller
app.get("/me", authMiddleware, (c) => controller.me(c));
```

### B. The Controller Layer (`auth.controller.ts`)
The Controller handles the **HTTP specifics**: Request parsing, Validation, Cookies, and Response formatting.

**Key responsibilities in `login(c)`:**
1.  **Read Input**: `const { username, password } = await c.req.json();`
2.  **Validate**: Checks if username/password are missing.
3.  **Call Service**: `await this.service.login(username, password)`
4.  **Set Cookie**: Stores the JWT token in a secure, HTTP-Only cookie so the frontend can't accidentally leak it.
5.  **Return Response**: Sends back the user data (without the password!).

### C. The Service Layer (`auth.service.ts`)
The Service handles the **Business Logic**. It doesn't know about HTTP (req/res), it just takes data and returns results.

**Key responsibilities in `login()`:**
1.  **Find User**: Calls `this.model.findByUsername(username)`.
2.  **Verify Password**: Uses `Bun.password.verify` to check if the input password matches the hashed password in the DB.
    *   *Security Note*: We never store plain text passwords!
3.  **Generate Token**: Creates a **JWT (JSON Web Token)** containing the user's ID and Role.
    *   `sign(payload, JWT_SECRET)`
4.  **Sanitize**: Removes the password field before returning the user object.

### D. The Model Layer (`auth.model.ts`)
The Model handles **Database Access**. In this project, we use **Drizzle ORM**.

**Key Code:**
```typescript
async findByUsername(username: string) {
    // db.query.users.findFirst is a Drizzle ORM method
    return await db.query.users.findFirst({
        where: eq(users.username, username), // SQL: WHERE username = ?
        with: { roles: true } // SQL: JOIN roles ...
    });
}
```

---

## 3. The Middleware (`auth.middleware.ts`)
This acts as a "Bouncer" for protected routes like `/me`.

1.  **Extract Token**: It looks for the `auth_token` in the **Cookie** (primary) or **Authorization Header** (fallback).
2.  **Verify**: It uses `verify(token, JWT_SECRET)` to ensure the token is valid and created by us.
3.  **Attach User**: If valid, it attaches the user payload to the context (`c.set("user", payload)`), so the Controller knows who is making the request.
4.  **Block**: If invalid or missing, it returns `401 Unauthorized`.
