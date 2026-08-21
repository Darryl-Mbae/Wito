import MarketingNav from "../components/marketing/MarketingNav";
import MarketingHero from "../components/marketing/MarketingHero";
import FeatureSections from "../components/marketing/FeatureSections";
import WhyChooseUs from "../components/marketing/WhyChooseUs";
import Pricing from "../components/marketing/Pricing";
import FAQ from "../components/marketing/FAQ";
import FinalCTA from "../components/marketing/FinalCTA";
import MarketingFooter from "../components/marketing/MarketingFooter";
import UnderConstructionBanner from "../components/UnderConstructionBanner";
import TemplateGallery from "../components/marketing/TemplateGallery";

const Website = () => {
  return (
    <div className="w-full min-h-screen bg-white text-gray-900 antialiased">
      <MarketingNav />
      <UnderConstructionBanner />

      <main>
        <MarketingHero />
        <FeatureSections />
        <WhyChooseUs />
        <TemplateGallery/>
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <MarketingFooter />
    </div>
  );
};

export default Website;
