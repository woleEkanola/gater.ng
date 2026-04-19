import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }
  
  return (
    <WishlistContent />
  );
}

function WishlistContent() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-primary">
            Hitix
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.682l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h1 className="text-2xl font-bold">My Wishlist</h1>
        </div>

        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No saved events</p>
          <p className="text-muted-foreground text-sm mt-2">
            Events you save will appear here
          </p>
          <a href="/events" className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Browse Events
          </a>
        </div>
      </main>
    </div>
  );
}