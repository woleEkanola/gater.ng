import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Ticket, Users, BarChart3 } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.b2BLandingPage.findUnique({
    where: { slug },
  });

  if (!page) {
    return { title: "Not Found" };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
}

export async function generateJsonLd(page: any) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hitix",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: page.metaDescription,
    publisher: {
      "@type": "Organization",
      name: "Hitix",
      url: "https://hitix.online",
    },
    areaServed: {
      "@type": "Country",
      name: "NG",
    },
    audience: {
      "@type": "Audience",
      audienceType: page.targetAudience,
    },
  };
}

export default async function B2BLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = await prisma.b2BLandingPage.findUnique({
    where: { slug },
  });

  if (!page) {
    notFound();
  }

  const features = JSON.parse(page.featuresJson) as string[];
  const jsonLd = await generateJsonLd(page);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-rose-600">
            Hitix
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/organizer" className="text-sm font-medium hover:text-rose-600">
              For Organizers
            </Link>
            <Link href="/auth-route/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              Event Ticketing Made Simple
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto">
              {page.h1Title}
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              {page.subHeadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={page.ctaLink}>
                <Button size="lg" className="text-lg px-8 py-6 bg-rose-600 hover:bg-rose-700">
                  {page.ctaText}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/organizer">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Learn More
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Free to start. No credit card required.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {features.slice(0, 3).map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                    {index === 0 ? (
                      <Ticket className="w-5 h-5" />
                    ) : index === 1 ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <BarChart3 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature}</h3>
                    <p className="text-sm text-gray-600">
                      Powerful features to help you succeed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Why Event Organizers Choose Hitix
            </h2>
            <div className="grid md:grid-cols-4 gap-8 mt-10 max-w-4xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-rose-600">10K+</div>
                <p className="text-sm text-gray-600">Events Created</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-rose-600">500K+</div>
                <p className="text-sm text-gray-600">Tickets Sold</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-rose-600">99.9%</div>
                <p className="text-sm text-gray-600">Uptime</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-rose-600">24/7</div>
                <p className="text-sm text-gray-600">Support</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-rose-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to {page.intent === "sell-tickets-for" ? "sell tickets" : "manage RSVPs"}?
            </h2>
            <p className="text-rose-100 mb-8 max-w-xl mx-auto">
              Join thousands of event organizers who trust Hitix for their events.
            </p>
            <Link href={page.ctaLink}>
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-rose-600 hover:bg-rose-50">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">Hitix</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/about" className="hover:text-white">
                About
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Hitix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}