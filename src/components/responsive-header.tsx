"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResponsiveHeaderProps {
  isLoggedIn?: boolean;
}

export function ResponsiveHeader({ isLoggedIn }: ResponsiveHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hitix
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/events" className="text-sm font-medium hover:text-primary">
              Discover Events
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/events/new"
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90"
                >
                  Create Event
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth-route/login" className="text-sm font-medium hover:text-primary">
                  Login
                </Link>
                <Link
                  href="/auth-route/register"
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t pt-4 flex flex-col gap-4">
            <Link 
              href="/events" 
              className="text-sm font-medium hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Discover Events
            </Link>
            {isLoggedIn ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/events/new"
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Event
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/auth-route/login" 
                  className="text-sm font-medium hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth-route/register"
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
