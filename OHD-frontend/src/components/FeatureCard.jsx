export default function FeatureCard({ title, description }) {
    return (
        <div className="bg-white shadow-md p-6 rounded-lg text-center">
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-gray-600 mt-2">{description}</p>
        </div>
    );
}
