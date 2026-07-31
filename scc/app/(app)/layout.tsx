import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Inventory", href: "/inventory" },
    { label: "Suppliers", href: "/suppliers" },
    { label: "Purchase Orders", href: "/purchase-orders" },
    { label: "Copilot", href: "/copilot" },
];

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen">
            <aside className="w-60 shrink-0 bg-ink-800 border-r border-line-700 p-4 flex flex-col">
                <div className="font-display text-lg font-bold mb-6">Chase Value</div>
                <nav className="flex flex-col gap-2">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-body-sm text-text-primary hover:text-brand-cobalt px-2 py-1.5 rounded"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto pt-6 border-t border-line-700">
                    <div className="text-sm text-text-muted mb-2">{session.user.name}</div>
                    <form action="/api/auth/sign-out" method="post">
                        <button type="submit" className="text-sm text-text-muted hover:text-signal-red">
                            Log out
                        </button>
                    </form>
                </div>
            </aside>
            <main className="flex-1 p-6 bg-ink-900">{children}</main>
        </div>
    );
}