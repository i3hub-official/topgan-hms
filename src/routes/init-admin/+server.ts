import { auth } from "$lib/server/auth";
import { json } from "@sveltejs/kit";

export const GET = async () => {
    try {
        const user = await auth.api.signUpEmail({
            body: {
                email: 'admin@topgan.com',
                password: 'admin123',
                name: 'Admin User',
            }
        });
        return json({ message: "Admin created", user });
    } catch {
        return json({ message: "Admin already exists or error occurred" }, { status: 400 });
    }
};