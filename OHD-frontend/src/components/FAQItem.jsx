import { useState } from "react";

export default function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="my-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-4 focus:outline-none flex justify-between items-center bg-[#eee]"
            >
                <span className="font-medium">{question}</span>
                <span className="text-xl">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && <p className="p-4 text-gray-600">{answer}</p>}
        </div>
    );
}
