import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="text-2xl font-bold text-white mb-4 block">
              Hitix
            </Link>
            <p className="text-sm">
              The easiest way to create, promote, and sell tickets for your events in Nigeria.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Discover</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/events" className="hover:text-white transition-colors">All Events</Link></li>
              <li><Link href="/events?category=Music" className="hover:text-white transition-colors">Music</Link></li>
              <li><Link href="/events?category=Business" className="hover:text-white transition-colors">Business</Link></li>
              <li><Link href="/events?category=Arts" className="hover:text-white transition-colors">Arts</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Organize</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/organizer" className="hover:text-white transition-colors">Create Event</Link></li>
              <li><Link href="/auth-route/register" className="hover:text-white transition-colors">Start Selling</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                support@hitix.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +234 800 123 4567
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Lagos, Nigeria
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Hitix. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="YouTube">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
