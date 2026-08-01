"use client";

import { useEffect, useState } from "react";
import { ChatMessageContent } from "@/components/chat-message";

type Message = { role: "user" | "assistant"; content: string };

export default function CopilotPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [slowResponse, setSlowResponse] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem("copilot-transcript");
        if (saved) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from sessionStorage on mount, not a derived-state loop
            setMessages(JSON.parse(saved));
            sessionStorage.removeItem("copilot-transcript");
        }
    }, []);

    async function handleSend() {
        if (!input.trim()) return;
        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setSending(true);
        setSlowResponse(false);

        const slowTimer = setTimeout(() => setSlowResponse(true), 2000);

        try {
            const res = await fetch("/api/copilot/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage.content }),
            });
            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply ?? "Sorry, something went wrong. Please try again." },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, something went wrong. Please try again." },
            ]);
        } finally {
            clearTimeout(slowTimer);
            setSending(false);
            setSlowResponse(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-96px)] max-w-[720px] mx-auto">
            <h1 className="font-display text-xl font-bold mb-4">Copilot</h1>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4">
                {messages.length === 0 && (
                    <div className="text-text-muted text-sm">
                        Ask about inventory, suppliers, or purchase orders — e.g. &quot;Which SKUs are critical right now?&quot;
                    </div>
                )}
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`text-sm p-3 rounded max-w-[85%] ${m.role === "user"
                            ? "bg-brand-cobalt/10 border border-brand-cobalt self-end"
                            : "bg-ink-700 self-start"
                            }`}
                    >
                        <ChatMessageContent content={m.content} />
                    </div>
                ))}
                {sending && (
                    <div className="text-text-muted text-sm">
                        {slowResponse ? "Still working on it — this is taking longer than usual..." : "Thinking..."}
                    </div>
                )}
            </div>

            <div className="flex gap-2 border-t border-line-700 pt-4">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask a question..."
                    className="flex-1 bg-ink-900 border border-line-700 rounded px-3 py-2 text-sm"
                />
                <button
                    onClick={handleSend}
                    disabled={sending}
                    className="bg-brand-cobalt text-ink-900 px-4 py-2 rounded text-sm font-medium"
                >
                    Send
                </button>
            </div>
        </div>
    );
}