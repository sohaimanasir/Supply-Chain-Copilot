"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatMessageContent } from "@/components/chat-message";

type Message = { role: "user" | "assistant"; content: string };

export function CopilotWidget() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    async function handleSend() {
        if (!input.trim()) return;
        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setSending(true);

        const res = await fetch("/api/copilot/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage.content }),
        });
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        setSending(false);
    }

    function expandToFullPage() {
        sessionStorage.setItem("copilot-transcript", JSON.stringify(messages));
        router.push("/copilot");
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {open && (
                <div className="w-[380px] h-[480px] bg-ink-700 border border-line-700 rounded-lg mb-3 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-line-700">
                        <span className="font-display font-bold text-sm">Copilot</span>
                        <div className="flex gap-2">
                            <button
                                onClick={expandToFullPage}
                                className="text-xs text-text-muted hover:text-brand-cobalt"
                            >
                                Expand
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-xs text-text-muted hover:text-signal-red"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                        {messages.length === 0 && (
                            <div className="text-text-muted text-sm">
                                Ask about inventory, suppliers, or purchase orders.
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`text-sm p-2 rounded max-w-[85%] ${m.role === "user"
                                    ? "bg-brand-cobalt/10 border border-brand-cobalt self-end"
                                    : "bg-ink-800 self-start"
                                    }`}
                            >
                                <ChatMessageContent content={m.content} />
                            </div>
                        ))}
                        {sending && <div className="text-text-muted text-sm">Thinking...</div>}
                    </div>
                    <div className="p-3 border-t border-line-700 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask a question..."
                            className="flex-1 bg-ink-900 border border-line-700 rounded px-2 py-1 text-sm"
                        />
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="bg-brand-cobalt text-ink-900 px-3 py-1 rounded text-sm"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
            <button
                onClick={() => setOpen(!open)}
                className="w-14 h-14 rounded-full bg-brand-cobalt text-ink-900 flex items-center justify-center shadow-lg text-xl"
            >
                💬
            </button>
        </div>
    );
}