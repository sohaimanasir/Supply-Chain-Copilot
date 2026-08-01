import Link from "next/link";

const CITATION_REGEX = /(\[[a-z0-9]{20,30}\]|\{po:[a-z0-9]{20,30}\})/g;

export function ChatMessageContent({ content }: { content: string }) {
    const parts = content.split(CITATION_REGEX);
    return (
        <>
            {parts.map((part, i) => {
                const poMatch = part.match(/^\{po:([a-z0-9]{20,30})\}$/);
                const itemMatch = part.match(/^\[([a-z0-9]{20,30})\]$/);

                if (poMatch) {
                    return (
                        <Link
                            key={i}
                            href={`/purchase-orders/${poMatch[1]}`}
                            className="inline-block font-mono text-[11px] border border-signal-mint text-signal-mint rounded-full px-1.5 py-0.5 mx-0.5 hover:bg-signal-mint/10"
                        >
                            view PO
                        </Link>
                    );
                }
                if (itemMatch) {
                    return (
                        <Link
                            key={i}
                            href={`/inventory/${itemMatch[1]}`}
                            className="inline-block font-mono text-[11px] border border-brand-cobalt text-brand-cobalt rounded-full px-1.5 py-0.5 mx-0.5 hover:bg-brand-cobalt/10"
                        >
                            source
                        </Link>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}