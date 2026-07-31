"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const { error } = await signIn.email({ email, password });
        if (error) {
            setError(error.message ?? "Login failed");
            return;
        }
        router.push("/dashboard");
    }

    return (
        <div style={{ maxWidth: 320, margin: "80px auto" }}>
            <h1>Sign in</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Sign in</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </form>
        </div>
    );
}