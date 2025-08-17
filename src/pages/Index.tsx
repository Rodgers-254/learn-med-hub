import Hero from "@/components/Hero";
import FeaturedBooks from "@/components/FeaturedBooks";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <FeaturedBooks />
       
        <Testimonials />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
