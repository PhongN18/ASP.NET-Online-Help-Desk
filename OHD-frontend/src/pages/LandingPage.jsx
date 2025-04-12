import FeatureCard from "@/components/FeatureCard";
import StepCard from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import FAQSection from "../components/FAQSection";

export default function LandingPage() {
    return (
        <div className=" min-h-screen flex flex-col">
            {/* Hero Section */}
            <header className="bg-blue-600 text-white py-16 text-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to Online Help Desk</h1>
                <p className="text-lg">Easily create and track your service requests within the campus.</p>
                <Link to="/login">
                    <Button className="mt-6 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-gray-200">
                        Get Started
                    </Button>
                </Link>
            </header>

            {/* Features Section */}
            <section className="custom-container py-16">
                <h2 className="text-3xl font-semibold text-center mb-8">Why Use OHD?</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <FeatureCard
                        title="Easy Request Submission"
                        description="Create service requests in seconds with our simple form."
                    />
                    <FeatureCard
                        title="Real-Time Updates"
                        description="Track your requests and receive notifications on progress."
                    />
                    <FeatureCard
                        title="Fast Response Time"
                        description="Facility managers and technicians handle your requests quickly."
                    />
                </div>
            </section>

            {/* How It Works */}
            <section className="custom-container py-16">
                <h2 className="text-3xl text-center font-semibold mb-8">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <StepCard step="1" title="Login" description="Sign in to your account to access the help desk." />
                    <StepCard step="2" title="Create a Request" description="Describe the issue and submit your request." />
                    <StepCard step="3" title="Track & Resolve" description="Get updates and see when your issue is fixed." />
                </div>
            </section>

            {/* FAQ Section */}
            <FAQSection />
        </div>
    );
}
