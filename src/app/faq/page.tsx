
"use client";

import { useEffect, useState } from 'react';
import { MainAppLayout } from '@/components/layout/MainAppLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { Loader2, AlertTriangle, MessageCircleQuestion } from 'lucide-react';
import type { FAQ } from '@/data/contentTypes';

export default function FaqPage() {
  const [activeFaqs, setActiveFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const faqsRef = ref(rtdb, 'content/faqs');
    // Query for active FAQs only
    const activeFaqsQuery = query(faqsRef, orderByChild('isActive'), equalTo(true));

    const unsubscribe = onValue(activeFaqsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const faqList: FAQ[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setActiveFaqs(faqList);
        setError(null);
      } else {
        setActiveFaqs([]);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase RTDB read error (FAQs page):", err);
      setError("Failed to load FAQs. Please try again later.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <MainAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading FAQs...</p>
        </div>
      </MainAppLayout>
    );
  }

  if (error) {
    return (
      <MainAppLayout>
        <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-md flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-10 w-10" />
          <div>
            <h3 className="font-semibold text-xl mb-2">Error Loading FAQs</h3>
            <p>{error}</p>
          </div>
        </div>
      </MainAppLayout>
    );
  }

  return (
    <MainAppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <MessageCircleQuestion className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about our products and services.
          </p>
        </div>

        {activeFaqs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {activeFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="bg-card border border-border rounded-lg shadow-sm">
                <AccordionTrigger className="p-5 text-left hover:no-underline text-base font-medium text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="p-5 pt-0 text-muted-foreground leading-relaxed">
                  {faq.answer.split('\\n').map((paragraph, index) => (
                    <p key={index} className={index > 0 ? 'mt-2' : ''}>{paragraph}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-xl text-muted-foreground text-center py-10">
            No FAQs available at the moment. Please check back later.
          </p>
        )}
      </div>
    </MainAppLayout>
  );
}
