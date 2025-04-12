export default function StepCard({ step, title, description }) {
    return (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center">
            <span className="text-2xl font-bold bg-blue-500 text-white px-4 py-2 rounded-full">
                {step}
            </span>
            <h3 className="text-xl font-semibold mt-4">{title}</h3>
            <p className="text-gray-600 mt-2">{description}</p>
        </div>
    );
}
