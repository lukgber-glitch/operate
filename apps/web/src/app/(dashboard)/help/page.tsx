'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  MessageCircle,
  Video,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I create a new invoice?',
    answer:
      'To create a new invoice, navigate to Finance > Invoices and click the "New Invoice" button. Fill in the customer details, line items, and tax information. You can preview the invoice before sending it to your customer.',
    category: 'Invoices',
  },
  {
    id: '2',
    question: 'How do I connect my bank account?',
    answer:
      'Go to Finance > Banking and click "Connect Account". Select your bank from the list and follow the secure authentication process. We use bank-level encryption to protect your data.',
    category: 'Banking',
  },
  {
    id: '3',
    question: 'What tax categories are available?',
    answer:
      'Operate supports all standard German tax categories including business expenses, home office, travel, meals, and more. The AI can automatically suggest categories based on transaction descriptions.',
    category: 'Tax',
  },
  {
    id: '4',
    question: 'How does AI classification work?',
    answer:
      'Our AI analyzes transaction descriptions, amounts, and merchant information to suggest tax categories. You can configure automation settings to approve suggestions automatically or review them manually.',
    category: 'AI & Automation',
  },
  {
    id: '5',
    question: 'Can I export my financial data?',
    answer:
      'Yes, you can export data in multiple formats (CSV, Excel, PDF) from the Reports section. You can also connect directly to DATEV or other accounting software for seamless integration.',
    category: 'Exports',
  },
  {
    id: '6',
    question: 'How do I manage team members?',
    answer:
      'Navigate to Settings > Team to invite new members, assign roles, and manage permissions. You can control access to different areas of the platform based on user roles.',
    category: 'Team',
  },
  {
    id: '7',
    question: 'What security measures are in place?',
    answer:
      'We use bank-level 256-bit encryption, two-factor authentication, and are fully GDPR compliant. All data is stored in secure EU data centers with regular security audits.',
    category: 'Security',
  },
  {
    id: '8',
    question: 'How do I cancel my subscription?',
    answer:
      'You can cancel your subscription anytime from Settings > Billing. Your data will remain accessible until the end of your billing period, and you can export it before cancellation.',
    category: 'Billing',
  },
];

const categories = Array.from(new Set(faqs.map((f) => f.category)));

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
        <p className="text-white/70 mt-2">
          Get answers to your questions and learn how to use Operate
        </p>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="lg">
          <div className="relative">
            <HelpCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base h-12"
            />
          </div>
      </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Contact Options */}
        <motion.div variants={fadeUp} className="space-y-4">
          <GlassCard padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="mr-2 h-4 w-4" />
                Live Chat
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Email Us
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Video className="mr-2 h-4 w-4" />
                Schedule Call
              </Button>
            </CardContent>
          </GlassCard>

          <GlassCard padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Video className="mr-2 h-4 w-4" />
                Video Tutorials
              </Button>
            </CardContent>
          </GlassCard>

          {/* Categories */}
          <GlassCard padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedCategory === null ? 'primary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(null)}
              >
                All Topics
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* FAQ List */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <GlassCard padding="lg">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''}{' '}
                {selectedCategory ? `in ${selectedCategory}` : 'available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-16">
                  <HelpCircle className="mx-auto h-16 w-16 text-white/35" />
                  <h3 className="mt-4 text-lg font-semibold">No results found</h3>
                  <p className="mt-2 text-sm text-white/70">
                    Try different keywords or browse all topics
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFAQs.map((faq) => (
                    <Card
                      key={faq.id}
                      className="rounded-[16px] cursor-pointer transition-all hover:shadow-md"
                      onClick={() => toggleFAQ(faq.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-primary">
                                {faq.category}
                              </span>
                            </div>
                            <CardTitle className="text-base font-semibold">
                              {faq.question}
                            </CardTitle>
                            {expandedFAQ === faq.id && (
                              <CardDescription className="mt-3 text-sm">
                                {faq.answer}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {expandedFAQ === faq.id ? (
                              <ChevronUp className="h-5 w-5 text-white/70" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-white/70" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
