"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Globe, Twitter, Instagram, Facebook, Camera } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  facebook: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    website: "",
    twitter: "",
    instagram: "",
    facebook: "",
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => {
        if (res.status === 401) {
          router.push("/auth-route/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProfile(data);
          setFormData({
            name: data.name || "",
            bio: data.bio || "",
            website: data.website || "",
            twitter: data.twitter || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Gater.ng
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden">
                  {profile?.image ? (
                    <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-rose-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{profile?.name || "Your Name"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell people about yourself..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="website">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="twitter">
                  <Twitter className="w-4 h-4 inline mr-2" />
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="username"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instagram">
                  <Instagram className="w-4 h-4 inline mr-2" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="username"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="facebook">
                  <Facebook className="w-4 h-4 inline mr-2" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="facebook.com/yourpage"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}