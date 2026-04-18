"use client";

import { useEffect, useState } from "react";
import { User, X } from "lucide-react";

interface Speaker {
  id: string;
  name: string;
  bio?: string | null;
  image?: string | null;
  title?: string | null;
  company?: string | null;
}

interface SpeakerModalProps {
  speaker: Speaker;
  onClose: () => void;
}

export function SpeakerModal({ speaker, onClose }: SpeakerModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden mb-4">
              {speaker.image ? (
                <img
                  src={speaker.image}
                  alt={speaker.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-semibold">{speaker.name}</h3>
            {speaker.title && (
              <p className="text-muted-foreground">{speaker.title}</p>
            )}
            {speaker.company && (
              <p className="text-sm text-muted-foreground">{speaker.company}</p>
            )}
          </div>
          
          {speaker.bio && (
            <div className="text-center">
              <p className="text-muted-foreground whitespace-pre-wrap">{speaker.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SpeakerGridProps {
  speakers: Speaker[];
  label: string;
}

export function SpeakerGrid({ speakers, label }: SpeakerGridProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  if (speakers.length === 0) return null;

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-4">{label}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {speakers.map((speaker) => (
            <button
              key={speaker.id}
              onClick={() => setSelectedSpeaker(speaker)}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left w-full"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {speaker.image ? (
                  <img
                    src={speaker.image}
                    alt={speaker.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-left">{speaker.name}</p>
                {speaker.title && (
                  <p className="text-sm text-muted-foreground text-left">{speaker.title}</p>
                )}
                {speaker.company && (
                  <p className="text-sm text-muted-foreground text-left">{speaker.company}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedSpeaker && (
        <SpeakerModal
          speaker={selectedSpeaker}
          onClose={() => setSelectedSpeaker(null)}
        />
      )}
    </>
  );
}