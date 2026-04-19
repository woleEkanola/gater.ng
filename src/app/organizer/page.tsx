import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Ticket, BarChart, Smartphone, CreditCard, Users, ArrowRight, Check } from "lucide-react";

export default function OrganizerPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-rose-600">
            Hitix
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/events" className="text-sm font-medium hover:text-rose-600">
              Discover Events
            </Link>
            <Link href="/auth-route/login" className="text-sm font-medium hover:text-rose-600">
              Login
            </Link>
            <Link
              href="/auth-route/register"
              className="px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-medium hover:bg-rose-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Create unforgettable
            <span className="text-rose-600"> events</span>
          </h1>
          <p className="text-xl text-gray-500 mb-8">
            The easiest way to plan, promote, and sell tickets for your events. 
            Join thousands of organizers across Nigeria.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth-route/register"
              className="px-8 py-3 bg-rose-600 text-white rounded-md font-medium hover:bg-rose-700 inline-flex items-center justify-center gap-2"
            >
              Start Selling Tickets Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 inline-flex items-center justify-center"
            >
              See How It Works
            </Link>
          </div>
        </div>

        <div id="features" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to sell tickets
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Ticket className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Ticket Creation</h3>
              <p className="text-gray-500">
                Create multiple ticket types in seconds. Set prices, quantities, and early bird discounts.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile Ticketing</h3>
              <p className="text-gray-500">
                QR code tickets that work on any phone. No app needed - just scan and check in instantly.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Payments</h3>
              <p className="text-gray-500">
                Get paid directly to your bank account. Money transfers automatically after each sale.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <BarChart className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-500">
                Track sales, monitor attendance, and see how your events are performing in real-time.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Attendee Management</h3>
              <p className="text-gray-500">
                Build your audience with attendee lists. Export data and send follow-up communications.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Event Pages</h3>
              <p className="text-gray-500">
                Beautiful, mobile-optimized event pages that look great on any device.
              </p>
            </div>
          </div>
        </div>

        <div className="py-16 bg-gray-50 rounded-2xl px-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Simple, transparent pricing
          </h2>
          
          <div className="max-w-md mx-auto">
            <div className="p-8 bg-white border rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-2">For Organizers</h3>
              <p className="text-4xl font-bold mb-4">5% <span className="text-lg font-normal text-gray-500">per ticket</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Unlimited events
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Unlimited ticket types
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Real-time analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  QR check-in
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Instant payouts
                </li>
              </ul>
              <Link
                href="/auth-route/register"
                className="block w-full py-3 bg-rose-600 text-white text-center rounded-md font-medium hover:bg-rose-700"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>

        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to grow your audience?
          </h2>
          <p className="text-xl text-gray-500 mb-8">
            Join thousands of organizers already using Hitix
          </p>
          <Link
            href="/auth-route/register"
            className="px-8 py-3 bg-rose-600 text-white rounded-md font-medium hover:bg-rose-700 inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      <footer className="border-t py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-2xl font-bold text-rose-600">Hitix</div>
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/events" className="hover:text-rose-600">Discover Events</Link>
              <Link href="/organizer/demo" className="hover:text-rose-600">Demo</Link>
              <span>&copy; {new Date().getFullYear()} Hitix</span>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}