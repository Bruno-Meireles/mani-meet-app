import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/config/site";
import {
  Faq,
  FinalCta,
  Hero,
  Highlights,
  HowItWorks,
  Services,
  Testimonials,
  VisitUs,
} from "@/features/landing/sections";
import { SiteLayout } from "@/features/site-shell/SiteLayout";

export const Route = createFileRoute("/")({
  head: () => ({ meta: pageMeta(undefined) }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <Highlights />
      <Services />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <VisitUs />
      <FinalCta />
    </SiteLayout>
  );
}
