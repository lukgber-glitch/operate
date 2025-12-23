'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'invoice' | 'meeting' | 'deadline' | 'reminder';
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Invoice #INV-2024-001 Due',
    date: new Date(2024, 11, 15),
    type: 'invoice',
  },
  {
    id: '2',
    title: 'Tax Filing Deadline',
    date: new Date(2024, 11, 20),
    type: 'deadline',
  },
  {
    id: '3',
    title: 'Quarterly Review Meeting',
    date: new Date(2024, 11, 22),
    type: 'meeting',
  },
  {
    id: '4',
    title: 'Payroll Processing',
    date: new Date(2024, 11, 28),
    type: 'reminder',
  },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (day: number) => {
    return mockEvents.filter(
      (event) =>
        event.date.getDate() === day &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear()
    );
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'deadline':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'meeting':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const days = [];
  const totalDays = daysInMonth(currentDate);
  const startDay = firstDayOfMonth(currentDate);

  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    days.push(day);
  }

  const upcomingEvents = mockEvents
    .filter((event) => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-white/70">View and manage your schedule</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <GlassCard padding="lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-white/70 py-2"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => {
                  const events = day ? getEventsForDate(day) : [];
                  const today = day ? isToday(day) : false;

                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] border border-white/10 rounded-lg p-2 ${
                        day
                          ? 'bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer transition-colors'
                          : 'bg-slate-900/30'
                      } ${today ? 'ring-2 ring-primary' : ''}`}
                    >
                      {day && (
                        <>
                          <div
                            className={`text-sm font-medium mb-1 ${
                              today
                                ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center'
                                : ''
                            }`}
                          >
                            {day}
                          </div>
                          <div className="space-y-1">
                            {events.map((event) => (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded ${getEventColor(event.type)}`}
                              >
                                {event.title.length > 15
                                  ? event.title.substring(0, 15) + '...'
                                  : event.title}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div variants={fadeUp} className="space-y-6">
          <GlassCard padding="lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <CardTitle>Upcoming Events</CardTitle>
              </div>
              <CardDescription>Next events on your calendar</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-white/70 text-center py-8">
                  No upcoming events
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-2xl text-white font-bold">
                          {event.date.getDate()}
                        </span>
                        <span className="text-xs text-white/70">
                          {monthNames[event.date.getMonth()]?.substring(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getEventColor(event.type)}>
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard padding="lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Event Types</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getEventColor('invoice')}>Invoice</Badge>
                  <span className="text-sm text-white/70">Payment deadlines</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getEventColor('deadline')}>Deadline</Badge>
                  <span className="text-sm text-white/70">Important dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getEventColor('meeting')}>Meeting</Badge>
                  <span className="text-sm text-white/70">Scheduled meetings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getEventColor('reminder')}>Reminder</Badge>
                  <span className="text-sm text-white/70">Task reminders</span>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
