"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  isVisible?: boolean;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const visibleFaqs = faqs.filter(faq => faq.isVisible !== false);

  if (visibleFaqs.length === 0) return null;

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-2">
      {visibleFaqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium pr-4">{faq.question}</span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 flex-shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="p-4 pt-0 text-sm text-muted-foreground whitespace-pre-wrap">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}