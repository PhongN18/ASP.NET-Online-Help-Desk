import FAQItem from "./FAQItem";

const faqs = [
    {
        question: "How do I create a new service request?",
        answer: "Simply log in to your account, go to 'Create Request,' select the facility, and submit your issue.",
    },
    {
        question: "How can I check the status of my request?",
        answer: "After logging in, visit the 'My Requests' page to see the current status and updates on your request.",
    },
    {
        question: "Who handles my service request?",
        answer: "The facility manager assigns requests to technicians who will work on resolving your issue.",
    },
    {
        question: "What happens if my request is rejected?",
        answer: "If a request is rejected, the reason will be provided. You may need to submit additional details.",
    },
    {
        question: "Will I get notifications for my requests?",
        answer: "Yes! You’ll receive email notifications for any status updates regarding your request.",
    },
];

export default function FAQSection() {
    return (
        <section className="py-16 px-6">
            <h2 className="text-3xl font-semibold text-center mb-8">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
                {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
            </div>
        </section>
    );
}
