import MarketingNav from "../components/marketing/MarketingNav";
import MarketingHero from "../components/marketing/MarketingHero";
import FeatureSections from "../components/marketing/FeatureSections";
import WhyChooseUs from "../components/marketing/WhyChooseUs";
import Pricing from "../components/marketing/Pricing";
import FAQ from "../components/marketing/FAQ";
import FinalCTA from "../components/marketing/FinalCTA";
import MarketingFooter from "../components/marketing/MarketingFooter";

const Website = () => {
  return (
    <div className="w-full min-h-screen bg-white text-gray-900 antialiased">
      <MarketingNav />
      <main>
        <MarketingHero />
        <FeatureSections />
        <WhyChooseUs />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <MarketingFooter />
    </div>
  );
};

export default Website;
