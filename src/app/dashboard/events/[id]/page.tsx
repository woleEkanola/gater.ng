"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { CopyLinkButton } from "@/components/copy-link-button";
import { ImageUpload } from "@/components/ui/upload-button";
import { SpeakerImageUpload } from "@/components/ui/speaker-image-upload";
import { GalleryUpload } from "@/components/ui/gallery-upload";
import { Download, Users, DollarSign, Ticket, Link as LinkIcon, Image, Pencil, Globe, Tag, Trash2, Plus, Percent, HelpCircle, Eye, EyeOff } from "lucide-react";

const ticketTypeSchema = z.object({
  name: z.string().min(1, "Ticket name is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
});

type TicketTypeFormData = z.infer<typeof ticketTypeSchema>;

export default function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loggingSale, setLoggingSale] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedDateTime, setEditedDateTime] = useState("");
  const [editedIsOnline, setEditedIsOnline] = useState(false);
  const [editedStreamingLink, setEditedStreamingLink] = useState("");
  const [editedAccessInstructions, setEditedAccessInstructions] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedTargetAudience, setEditedTargetAudience] = useState("");
  const [editedSpeakerLabel, setEditedSpeakerLabel] = useState("");
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState(0);
  const [newDiscountMaxUses, setNewDiscountMaxUses] = useState<number | "">("");

  useEffect(() => {
    async function fetchDiscountCodes() {
      if (!eventId) return;
      const res = await fetch(`/api/discount-codes?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setDiscountCodes(data);
      }
    }
    fetchDiscountCodes();
  }, [eventId]);

  const handleCreateDiscountCode = async () => {
    if (!newDiscountCode) return;
    setSavingDiscount(true);
    try {
      const res = await fetch("/api/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventId,
          code: newDiscountCode,
          discountType: newDiscountType,
          discountValue: newDiscountType === "percentage" ? newDiscountValue * 100 : newDiscountValue * 100,
          maxUses: newDiscountMaxUses || null,
        }),
      });
      if (res.ok) {
        const code = await res.json();
        setDiscountCodes([...discountCodes, code]);
        setNewDiscountCode("");
        setNewDiscountValue(0);
        setNewDiscountMaxUses("");
        setShowDiscountForm(false);
        toast({ title: "Success", description: "Discount code created" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleDeleteDiscountCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;
    try {
      const res = await fetch(`/api/discount-codes?id=${codeId}`, { method: "DELETE" });
      if (res.ok) {
        setDiscountCodes(discountCodes.filter(c => c.id !== codeId));
        toast({ title: "Success", description: "Discount code deleted" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const [faqs, setFaqs] = useState<any[]>([]);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [savingFaq, setSavingFaq] = useState(false);

  const [speakers, setSpeakers] = useState<any[]>([]);
  const [showSpeakerForm, setShowSpeakerForm] = useState(false);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [newSpeakerTitle, setNewSpeakerTitle] = useState("");
  const [newSpeakerCompany, setNewSpeakerCompany] = useState("");
  const [newSpeakerBio, setNewSpeakerBio] = useState("");
  const [newSpeakerImage, setNewSpeakerImage] = useState("");
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [savingSpeaker, setSavingSpeaker] = useState(false);

  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [editedContactEmail, setEditedContactEmail] = useState("");
  const [editedContactPhone, setEditedContactPhone] = useState("");
  const [editedWebsiteUrl, setEditedWebsiteUrl] = useState("");
  const [editedTwitterUrl, setEditedTwitterUrl] = useState("");
  const [editedFacebookUrl, setEditedFacebookUrl] = useState("");
  const [editedInstagramUrl, setEditedInstagramUrl] = useState("");
  const [editedYoutubeUrl, setEditedYoutubeUrl] = useState("");

  useEffect(() => {
    async function fetchFaqs() {
      if (!eventId) return;
      const res = await fetch(`/api/faqs?eventId=${eventId}&includeHidden=true`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    }
    fetchFaqs();
  }, [eventId]);

  const handleCreateFaq = async () => {
    if (!newFaqQuestion || !newFaqAnswer) return;
    setSavingFaq(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventId,
          question: newFaqQuestion,
          answer: newFaqAnswer,
        }),
      });
      if (res.ok) {
        const faq = await res.json();
        setFaqs([...faqs, faq]);
        setNewFaqQuestion("");
        setNewFaqAnswer("");
        setShowFaqForm(false);
        toast({ title: "Success", description: "FAQ added" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/faqs?id=${faqId}`, { method: "DELETE" });
      if (res.ok) {
        setFaqs(faqs.filter(f => f.id !== faqId));
        toast({ title: "Success", description: "FAQ deleted" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  useEffect(() => {
    async function fetchSpeakers() {
      if (!eventId) return;
      const res = await fetch(`/api/speakers?eventId=${eventId}&includeHidden=true`);
      if (res.ok) {
        const data = await res.json();
        setSpeakers(data);
      }
    }
    fetchSpeakers();
  }, [eventId]);

  useEffect(() => {
    async function fetchGallery() {
      if (!eventId) return;
      const res = await fetch(`/api/gallery?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data);
      }
    }
    fetchGallery();
  }, [eventId]);

  const handleUploadImage = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload/gallery", {
          method: "POST",
          body: formData,
        });
        const data = await uploadRes.json();
        
        if (data.url) {
          const saveRes = await fetch("/api/gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, image: data.url }),
          });
          if (saveRes.ok) {
            const gallery = await saveRes.json();
            setGalleryImages([...galleryImages, gallery]);
          }
        }
      }
      toast({ title: "Success", description: "Images uploaded" });
    } catch {
      toast({ title: "Error", description: "Failed to upload", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setGalleryImages(galleryImages.filter((g: any) => g.id !== id));
        toast({ title: "Success", description: "Image deleted" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleUploadSpeakerImage = async (file: File) => {
    if (!file) return;
    setSavingSpeaker(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload/speaker", {
        method: "POST",
        body: formData,
      });
      const data = await uploadRes.json();
      if (data.url) {
        setNewSpeakerImage(data.url);
        toast({ title: "Success", description: "Image uploaded" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to upload", variant: "destructive" });
    } finally {
      setSavingSpeaker(false);
    }
  };

  const handleCreateSpeaker = async () => {
    if (!newSpeakerName) return;
    setSavingSpeaker(true);
    try {
      const method = editingSpeakerId ? "PUT" : "POST";
      const body = editingSpeakerId 
        ? JSON.stringify({
            id: editingSpeakerId,
            name: newSpeakerName,
            title: newSpeakerTitle,
            company: newSpeakerCompany,
            bio: newSpeakerBio,
            image: newSpeakerImage,
          })
        : JSON.stringify({
            eventId: eventId,
            name: newSpeakerName,
            title: newSpeakerTitle,
            company: newSpeakerCompany,
            bio: newSpeakerBio,
            image: newSpeakerImage,
          });
      
      const res = await fetch("/api/speakers", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.ok) {
        const speaker = await res.json();
        if (editingSpeakerId) {
          setSpeakers(speakers.map(s => s.id === editingSpeakerId ? speaker : s));
        } else {
          setSpeakers([...speakers, speaker]);
        }
        setNewSpeakerName("");
        setNewSpeakerTitle("");
        setNewSpeakerCompany("");
        setNewSpeakerBio("");
        setNewSpeakerImage("");
        setEditingSpeakerId(null);
        setShowSpeakerForm(false);
        toast({ title: "Success", description: editingSpeakerId ? "Speaker updated" : "Speaker added" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSavingSpeaker(false);
    }
  };

  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!confirm("Are you sure you want to delete this speaker?")) return;
    try {
      const res = await fetch(`/api/speakers?id=${speakerId}`, { method: "DELETE" });
      if (res.ok) {
        setSpeakers(speakers.filter(s => s.id !== speakerId));
        toast({ title: "Success", description: "Speaker deleted" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleToggleSpeakerVisibility = async (speakerId: string, currentVisibility: boolean) => {
    try {
      const res = await fetch("/api/speakers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: speakerId, name: speakers.find(s => s.id === speakerId)?.name || "", isVisible: !currentVisibility }),
      });
      if (res.ok) {
        setSpeakers(speakers.map(s => s.id === speakerId ? { ...s, isVisible: !currentVisibility } : s));
        toast({ title: "Success", description: !currentVisibility ? "Speaker now visible" : "Speaker now hidden" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to toggle visibility", variant: "destructive" });
    }
  };

  const handleToggleFaqVisibility = async (faqId: string, currentVisibility: boolean) => {
    try {
      const res = await fetch("/api/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faqId, isVisible: !currentVisibility }),
      });
      if (res.ok) {
        setFaqs(faqs.map(f => f.id === faqId ? { ...f, isVisible: !currentVisibility } : f));
        toast({ title: "Success", description: !currentVisibility ? "FAQ now visible" : "FAQ now hidden" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to toggle visibility", variant: "destructive" });
    }
  };

  const handleToggleAllFaqs = async (showAll: boolean) => {
    try {
      const res = await fetch("/api/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, isVisible: showAll, showAll: true }),
      });
      if (res.ok) {
        setFaqs(faqs.map(f => ({ ...f, isVisible: showAll })));
        toast({ title: "Success", description: showAll ? "All FAQs now visible" : "All FAQs now hidden" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to toggle visibility", variant: "destructive" });
    }
  };

  const startEditingDetails = () => {
    setEditedTitle(event.title || "");
    setEditedDescription(event.description || "");
    setEditedLocation(event.location || "");
    setEditedDateTime(event.dateTime ? new Date(event.dateTime).toISOString().slice(0, 16) : "");
    setEditedIsOnline(event.isOnline || false);
    setEditedStreamingLink(event.streamingLink || "");
    setEditedAccessInstructions(event.accessInstructions || "");
    setEditedCategory(event.category || "");
    setEditedTargetAudience(event.targetAudience || "");
    setEditedSpeakerLabel(event.speakerLabel || "");
    setEditedContactEmail(event.contactEmail || "");
    setEditedContactPhone(event.contactPhone || "");
    setEditedWebsiteUrl(event.websiteUrl || "");
    setEditedTwitterUrl(event.twitterUrl || "");
    setEditedFacebookUrl(event.facebookUrl || "");
    setEditedInstagramUrl(event.instagramUrl || "");
    setEditedYoutubeUrl(event.youtubeUrl || "");
    setIsEditingDetails(true);
  };

  const saveEventDetails = async () => {
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
          location: editedIsOnline ? "Online" : editedLocation,
          dateTime: editedDateTime ? new Date(editedDateTime).toISOString() : null,
          isOnline: editedIsOnline,
          streamingLink: editedIsOnline ? editedStreamingLink : null,
          accessInstructions: editedIsOnline ? editedAccessInstructions : null,
          category: editedCategory,
          targetAudience: editedTargetAudience,
          speakerLabel: editedSpeakerLabel,
          contactEmail: editedContactEmail,
          contactPhone: editedContactPhone,
          websiteUrl: editedWebsiteUrl,
          twitterUrl: editedTwitterUrl,
          facebookUrl: editedFacebookUrl,
          instagramUrl: editedInstagramUrl,
          youtubeUrl: editedYoutubeUrl,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      setEvent({ 
        ...event, 
        title: editedTitle, 
        description: editedDescription, 
        location: editedIsOnline ? "Online" : editedLocation, 
        dateTime: result.dateTime,
        isOnline: editedIsOnline,
        streamingLink: editedStreamingLink,
        accessInstructions: editedAccessInstructions,
        category: editedCategory,
        targetAudience: editedTargetAudience,
      });
      setIsEditingDetails(false);
      toast({ title: "Success", description: "Event details updated" });
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSavingDetails(false);
    }
  };

  const saleSchema = z.object({
    ticketTypeId: z.string().min(1, "Ticket type required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    buyerName: z.string().optional(),
    buyerPhone: z.string().optional(),
    buyerEmail: z.string().email("Valid email required"),
  });

  type SaleFormData = z.infer<typeof saleSchema>;

  const {
    register: registerSaleForm,
    handleSubmit: handleSaleSubmit,
    reset: resetSaleForm,
    formState: { errors: saleErrors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketTypeFormData>({
    resolver: zodResolver(ticketTypeSchema),
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventRes, typesRes, attendeesRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/ticket-types?eventId=${eventId}`),
          fetch(`/api/attendees?eventId=${eventId}`),
        ]);
        const eventData = await eventRes.json();
        const typesData = await typesRes.json();
        const attendeesData = await attendeesRes.json();
        setEvent(eventData);
        setTicketTypes(typesData);
        setAttendees(attendeesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, [eventId]);

  const onSubmitTicketType = async (data: TicketTypeFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ticket-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, eventId: eventId }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      setTicketTypes([...ticketTypes, result]);
      reset();
      toast({ title: "Success", description: "Ticket type added" });
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketPrice = async (ticketTypeId: string, newPrice: number) => {
    try {
      const res = await fetch("/api/ticket-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketTypeId, price: newPrice }),
      });
      if (res.ok) {
        setTicketTypes(ticketTypes.map(tt => 
          tt.id === ticketTypeId ? { ...tt, price: newPrice } : tt
        ));
        toast({ title: "Success", description: "Price updated" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" });
    }
  };

  const onLogSale = async (data: SaleFormData) => {
    setLoggingSale(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventId,
          ticketTypeId: data.ticketTypeId,
          quantity: data.quantity,
          buyerName: data.buyerName,
          buyerPhone: data.buyerPhone,
          buyerEmail: data.buyerEmail,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      resetSaleForm();
      toast({ title: "Success", description: `Logged ${data.quantity} ticket(s) sale` });
      
      const attendeesRes = await fetch(`/api/attendees?eventId=${eventId}`);
      const attendeesData = await attendeesRes.json();
      setAttendees(attendeesData);
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoggingSale(false);
    }
  };

  const handleBannerChange = async (bannerUrl: string) => {
    setUploadingBanner(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banner: bannerUrl }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      setEvent({ ...event, banner: bannerUrl });
      toast({ title: "Success", description: "Banner updated" });
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setUploadingBanner(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            Hitix
          </Link>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {isEditingDetails ? (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Event title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Event description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={editedDateTime}
                    onChange={(e) => setEditedDateTime(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editedIsOnline"
                    checked={editedIsOnline}
                    onChange={(e) => setEditedIsOnline(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="editedIsOnline">Online Event</Label>
                </div>
              </div>
              
              {editedIsOnline ? (
                <div>
                  <Label>Streaming Link</Label>
                  <Input
                    value={editedStreamingLink}
                    onChange={(e) => setEditedStreamingLink(e.target.value)}
                    placeholder="https://zoom.us/..."
                  />
                  <Label className="mt-4">Access Instructions</Label>
                  <Input
                    value={editedAccessInstructions}
                    onChange={(e) => setEditedAccessInstructions(e.target.value)}
                    placeholder="Instructions for attendees (e.g., Link will be sent 1 hour before)"
                  />
                </div>
              ) : (
                <div>
                  <Label>Location</Label>
                  <Input
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    placeholder="Event location"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select category</option>
                    <option value="Music">Music</option>
                    <option value="Business">Business</option>
                    <option value="Technology">Technology</option>
                    <option value="Sports">Sports</option>
                    <option value="Food & Drink">Food & Drink</option>
                    <option value="Arts">Arts</option>
                    <option value="Education">Education</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Networking">Networking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Who is this event for?</Label>
                  <Input
                    value={editedTargetAudience}
                    onChange={(e) => setEditedTargetAudience(e.target.value)}
                    placeholder="Target audience"
                  />
                </div>
                <div>
                  <Label>Speaker Label</Label>
                  <Input
                    value={editedSpeakerLabel}
                    onChange={(e) => setEditedSpeakerLabel(e.target.value)}
                    placeholder="e.g., Speakers, Guests, Panelists (default: Speakers)"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEventDetails} disabled={savingDetails}>
                  {savingDetails ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditingDetails(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{event?.title || `Event ID: ${eventId}`}</h1>
                  {event?.description && (
                    <p className="text-muted-foreground">{event.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={startEditingDetails}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              {event?.dateTime && (
                <p className="text-muted-foreground">
                  {new Date(event.dateTime).toLocaleString()} • {event.location}
                </p>
              )}
            </div>
          )}
        </div>

        {event?.slug && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Share Event Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/events/${event.slug}`}
                  className="flex-1"
                  id="event-link"
                />
                <CopyLinkButton
                  url={`${typeof window !== "undefined" ? window.location.origin : ""}/events/${event.slug}`}
                  title={event.title}
                  image={event.banner}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Share this link with your attendees. The link includes a preview image of your event banner.
              </p>
            </CardContent>
          </Card>
        )}

        {event?.slug && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Event Banner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={event.banner || ""}
                onChange={handleBannerChange}
                loading={uploadingBanner}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Recommended size: 1200x600px. This image will be used as the preview when sharing your event link.
              </p>
            </CardContent>
          </Card>
        )}

        {event?.slug && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Discount Codes
              </CardTitle>
              <Button size="sm" onClick={() => setShowDiscountForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Code
              </Button>
            </CardHeader>
            <CardContent>
              {showDiscountForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Code</Label>
                      <Input
                        value={newDiscountCode}
                        onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())}
                        placeholder="e.g., EARLY20"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <select
                        value={newDiscountType}
                        onChange={(e) => setNewDiscountType(e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <Label>Value {newDiscountType === "percentage" ? "(%)" : "(₦)"}</Label>
                      <Input
                        type="number"
                        value={newDiscountValue}
                        onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                        placeholder={newDiscountType === "percentage" ? "10" : "1000"}
                      />
                    </div>
                    <div>
                      <Label>Max Uses (optional)</Label>
                      <Input
                        type="number"
                        value={newDiscountMaxUses}
                        onChange={(e) => setNewDiscountMaxUses(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateDiscountCode} disabled={savingDiscount || !newDiscountCode}>
                      {savingDiscount ? "Creating..." : "Create Code"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowDiscountForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {discountCodes.length === 0 ? (
                <p className="text-muted-foreground">No discount codes yet</p>
              ) : (
                <div className="space-y-2">
                  {discountCodes.map((code) => (
                    <div key={code.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{code.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {code.discountType === "percentage" 
                            ? `${code.discountValue / 100}% off` 
                            : `₦${(code.discountValue / 100).toLocaleString()} off`}
                          {code.maxUses && ` • ${code.maxUses - code.usesCount} uses left`}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDiscountCode(code.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {event?.slug && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
              <Button size="sm" onClick={() => setShowFaqForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add FAQ
              </Button>
            </CardHeader>
            <CardContent>
              {showFaqForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-4">
                  <div>
                    <Label>Question</Label>
                    <Input
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      placeholder="e.g., What should I bring?"
                    />
                  </div>
                  <div>
                    <Label>Answer</Label>
                    <Textarea
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      placeholder="Answer to the question"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateFaq} disabled={savingFaq || !newFaqQuestion || !newFaqAnswer}>
                      {savingFaq ? "Adding..." : "Add FAQ"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowFaqForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {faqs.length === 0 ? (
                <p className="text-muted-foreground">No FAQs yet</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{faqs.filter(f => f.isVisible).length} of {faqs.length} visible</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleAllFaqs(false)}>
                        Hide All
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleAllFaqs(true)}>
                        Show All
                      </Button>
                    </div>
                  </div>
                  {faqs.map((faq) => (
                    <div key={faq.id} className={`border rounded-lg p-4 ${faq.isVisible === false ? "opacity-50" : ""}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{faq.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {faq.isVisible ? "Visible" : "Hidden"}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggleFaqVisibility(faq.id, faq.isVisible)}
                            title={faq.isVisible ? "Hide" : "Show"}
                          >
                            {faq.isVisible ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFaq(faq.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Speakers</CardTitle>
              <Button size="sm" onClick={() => setShowSpeakerForm(!showSpeakerForm)}>
                {showSpeakerForm ? "Cancel" : "Add Speaker"}
              </Button>
            </div>
          </CardHeader>
          {showSpeakerForm && (
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={newSpeakerName} onChange={(e) => setNewSpeakerName(e.target.value)} placeholder="Name" />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={newSpeakerTitle} onChange={(e) => setNewSpeakerTitle(e.target.value)} placeholder="e.g., CEO, Speaker" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company</Label>
                    <Input value={newSpeakerCompany} onChange={(e) => setNewSpeakerCompany(e.target.value)} placeholder="Company" />
                  </div>
                </div>
                <div>
                  <SpeakerImageUpload
                    value={newSpeakerImage}
                    onChange={setNewSpeakerImage}
                    loading={savingSpeaker}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Click to upload speaker photo</p>
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea value={newSpeakerBio} onChange={(e) => setNewSpeakerBio(e.target.value)} placeholder="Bio" />
                </div>
                <Button onClick={handleCreateSpeaker} disabled={savingSpeaker}>
                  {savingSpeaker ? "Saving..." : editingSpeakerId ? "Update Speaker" : "Add Speaker"}
                </Button>
                {editingSpeakerId && (
                  <Button variant="outline" onClick={() => {
                    setEditingSpeakerId(null);
                    setNewSpeakerName("");
                    setNewSpeakerTitle("");
                    setNewSpeakerCompany("");
                    setNewSpeakerBio("");
                    setNewSpeakerImage("");
                    setShowSpeakerForm(false);
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          )}

          <CardContent>
            {speakers.length === 0 ? (
              <p className="text-muted-foreground">No speakers yet</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{speakers.filter(s => s.isVisible).length} of {speakers.length} visible</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      speakers.forEach(s => handleToggleSpeakerVisibility(s.id, false));
                    }}>
                      Hide All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      speakers.forEach(s => handleToggleSpeakerVisibility(s.id, true));
                    }}>
                      Show All
                    </Button>
                  </div>
                </div>
                {speakers.map((speaker) => (
                  <div key={speaker.id} className={`border rounded-lg p-4 ${speaker.isVisible === false ? "opacity-50" : ""}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{speaker.name}</p>
                        {speaker.title && <p className="text-sm text-muted-foreground">{speaker.title}</p>}
                        {speaker.company && <p className="text-sm text-muted-foreground">{speaker.company}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          {speaker.isVisible ? "Visible" : "Hidden"}
                        </p>
                      </div>
<div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setEditingSpeakerId(speaker.id);
                              setNewSpeakerName(speaker.name);
                              setNewSpeakerTitle(speaker.title || "");
                              setNewSpeakerCompany(speaker.company || "");
                              setNewSpeakerBio(speaker.bio || "");
                              setNewSpeakerImage(speaker.image || "");
                              setShowSpeakerForm(true);
                            }}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggleSpeakerVisibility(speaker.id, speaker.isVisible)}
                            title={speaker.isVisible ? "Hide" : "Show"}
                          >
                            {speaker.isVisible ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSpeaker(speaker.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gallery</CardTitle>
              <Button size="sm" onClick={() => setShowGalleryForm(!showGalleryForm)}>
                {showGalleryForm ? "Cancel" : "Add Image"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map((img: any) => (
                <div key={img.id} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <img src={img.image} alt={img.caption || "Gallery"} className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => handleDeleteGallery(img.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            {showGalleryForm && (
              <div className="mt-4">
                <GalleryUpload
                  onUpload={async (url) => {
                    const saveRes = await fetch("/api/gallery", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ eventId, image: url }),
                    });
                    if (saveRes.ok) {
                      const gallery = await saveRes.json();
                      setGalleryImages([...galleryImages, gallery]);
                      toast({ title: "Success", description: "Image uploaded" });
                    }
                  }}
                  isUploading={uploadingImage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Contacts & Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input 
                  value={editedContactEmail || ""} 
                  onChange={(e) => setEditedContactEmail(e.target.value)} 
                  placeholder="contact@event.com"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input 
                  value={editedContactPhone || ""} 
                  onChange={(e) => setEditedContactPhone(e.target.value)} 
                  placeholder="+234..."
                />
              </div>
            </div>
            <div>
              <Label>Website URL</Label>
              <Input 
                value={editedWebsiteUrl || ""} 
                onChange={(e) => setEditedWebsiteUrl(e.target.value)} 
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Twitter/X</Label>
                <Input 
                  value={editedTwitterUrl || ""} 
                  onChange={(e) => setEditedTwitterUrl(e.target.value)} 
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div>
                <Label>Facebook</Label>
                <Input 
                  value={editedFacebookUrl || ""} 
                  onChange={(e) => setEditedFacebookUrl(e.target.value)} 
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Instagram</Label>
                <Input 
                  value={editedInstagramUrl || ""} 
                  onChange={(e) => setEditedInstagramUrl(e.target.value)} 
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <Label>YouTube</Label>
                <Input 
                  value={editedYoutubeUrl || ""} 
                  onChange={(e) => setEditedYoutubeUrl(e.target.value)} 
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
            <Button onClick={saveEventDetails} disabled={savingDetails}>
              {savingDetails ? "Saving..." : "Save Contacts & Links"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Add Ticket Type</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitTicketType)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ticket Name</Label>
                  <Input {...register("name")} placeholder="e.g., Regular, VIP" />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Price (₦)</Label>
                  <Input
                    type="number"
                    step="100"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Quantity Available</Label>
                  <Input
                    type="number"
                    {...register("quantity", { valueAsNumber: true })}
                    placeholder="100"
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Ticket Type"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Types</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketTypes.length === 0 ? (
                <p className="text-muted-foreground">No ticket types yet</p>
              ) : (
                <div className="space-y-4">
                  {ticketTypes.map((tt) => (
                    <div key={tt.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{tt.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(tt.price)} • {tt.quantity} available • {tt.soldCount} sold
                        </p>
                      </div>
                      {tt.soldCount === 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const currentPrice = (tt.price / 100).toString();
                            const newPrice = prompt("Enter new price (in Naira):", currentPrice);
                            if (newPrice && !isNaN(Number(newPrice))) {
                              updateTicketPrice(tt.id, Number(newPrice) * 100);
                            }
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log Manual Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaleSubmit(onLogSale)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ticket Type</Label>
                  <select
                    {...registerSaleForm("ticketTypeId")}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select ticket type</option>
                    {ticketTypes.map((tt) => (
                      <option key={tt.id} value={tt.id}>
                        {tt.name} - ₦{(tt.price / 100).toLocaleString()} ({tt.quantity - tt.soldCount} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    {...registerSaleForm("quantity", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Buyer Name</Label>
                  <Input {...registerSaleForm("buyerName")} placeholder="John Doe" />
                </div>

                <div className="space-y-2">
                  <Label>Buyer Email *</Label>
                  <Input
                    {...registerSaleForm("buyerEmail", { required: true })}
                    placeholder="john@example.com"
                    type="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Buyer Phone</Label>
                  <Input
                    {...registerSaleForm("buyerPhone")}
                    placeholder="08012345678"
                    type="tel"
                  />
                </div>

                <Button type="submit" disabled={loggingSale}>
                  {loggingSale ? "Processing..." : "Log Sale"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attendees ({attendees.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/attendees?eventId=${eventId}&format=csv`, "_blank")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : attendees.length === 0 ? (
                <p className="text-muted-foreground">No tickets sold yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Ticket ID</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.slice(0, 10).map((ticket) => (
                        <tr key={ticket.id} className="border-b">
                          <td className="py-2 font-mono">{ticket.ticketId}</td>
                          <td className="py-2">{ticket.ticketType?.name}</td>
                          <td className="py-2">{ticket.owner?.email || "Guest"}</td>
                          <td className="py-2">
                            {ticket.isUsed ? (
                              <span className="text-green-600">Used</span>
                            ) : (
                              <span className="text-muted-foreground">Not Used</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {attendees.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing 10 of {attendees.length} attendees. Export CSV for full list.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
