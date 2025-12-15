'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { Bug, Lightbulb, MessageSquare, Send, Star } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

type FeedbackType = 'bug' | 'feature' | 'general';

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Feedback submitted',
      description: 'Thank you for your feedback! We will review it shortly.',
    });

    // Reset form
    setFeedbackType('general');
    setSubject('');
    setDescription('');
    setRating(0);
    setEmail('');
    setIsSubmitting(false);
  };

  const feedbackTypes = [
    {
      value: 'bug' as const,
      label: 'Bug Report',
      icon: Bug,
      description: 'Report a problem or issue',
      color: 'text-red-600',
    },
    {
      value: 'feature' as const,
      label: 'Feature Request',
      icon: Lightbulb,
      description: 'Suggest a new feature',
      color: 'text-yellow-600',
    },
    {
      value: 'general' as const,
      label: 'General Feedback',
      icon: MessageSquare,
      description: 'Share your thoughts',
      color: 'text-blue-600',
    },
  ];

  const selectedType = feedbackTypes.find((t) => t.value === feedbackType);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-white/70">
          Help us improve Operate by sharing your feedback
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback Type Selection */}
        <motion.div variants={fadeUp} className="space-y-4">
          <GlassCard padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Select Type</CardTitle>
              <CardDescription>Choose the type of feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.value}
                    className={`rounded-[16px] cursor-pointer transition-all ${
                      feedbackType === type.value
                        ? 'ring-2 ring-primary shadow-md'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setFeedbackType(type.value)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${type.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{type.label}</h4>
                          <p className="text-xs text-white/70 mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </GlassCard>

          <GlassCard padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Why Feedback Matters</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Helps us fix bugs faster</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Shapes future features</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Improves user experience</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Prioritizes development</span>
                </li>
              </ul>
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* Feedback Form */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <GlassCard padding="lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                {selectedType && (
                  <>
                    <div className={`p-2 rounded-md bg-primary/10 ${selectedType.color}`}>
                      <selectedType.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{selectedType.label}</CardTitle>
                      <CardDescription>{selectedType.description}</CardDescription>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your feedback"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Please describe the bug, including steps to reproduce it...'
                        : feedbackType === 'feature'
                        ? 'Describe the feature you would like to see...'
                        : 'Share your thoughts and suggestions...'
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                {/* Rating (for general feedback) */}
                {feedbackType === 'general' && (
                  <div className="space-y-2">
                    <Label>Overall Rating</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority (for bug reports) */}
                {feedbackType === 'bug' && (
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Minor issue</SelectItem>
                        <SelectItem value="medium">Medium - Affects usability</SelectItem>
                        <SelectItem value="high">High - Blocking functionality</SelectItem>
                        <SelectItem value="critical">
                          Critical - App unusable
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Contact Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-white/70">
                    We may contact you for follow-up questions
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSubject('');
                      setDescription('');
                      setRating(0);
                      setEmail('');
                    }}
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
