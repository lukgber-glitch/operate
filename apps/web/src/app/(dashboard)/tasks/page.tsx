'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { CheckCircle2, Circle, Clock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review pending invoices',
    description: 'Check and approve 5 pending invoices from last week',
    completed: false,
    priority: 'high',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: '2',
    title: 'Update tax settings',
    description: 'Configure VAT rates for Q1 2025',
    completed: false,
    priority: 'medium',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: '3',
    title: 'Reconcile bank transactions',
    description: 'Match November transactions with invoices',
    completed: true,
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: '4',
    title: 'Prepare monthly report',
    description: 'Generate financial summary for November',
    completed: false,
    priority: 'low',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: '5',
    title: 'Contact accountant',
    description: 'Discuss year-end tax planning',
    completed: true,
    priority: 'medium',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast({
      title: 'Task deleted',
      description: 'Task has been removed from your list.',
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      priority: 'medium',
      createdAt: new Date(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    toast({
      title: 'Task created',
      description: 'New task has been added to your list.',
    });
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';
    return `${diffDays}d`;
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-white/70">
          {activeCount} active task{activeCount !== 1 ? 's' : ''}, {completedCount} completed
        </p>
      </motion.div>

      {/* Add Task */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="lg">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button onClick={handleAddTask}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
      </GlassCard>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active
          <Badge variant="secondary" className="ml-2">
            {activeCount}
          </Badge>
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
          <Badge variant="secondary" className="ml-2">
            {completedCount}
          </Badge>
        </Button>
      </motion.div>

      {/* Tasks List */}
      <motion.div variants={fadeUp} className="space-y-3">
        {filteredTasks.length === 0 ? (
          <GlassCard padding="lg">
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="h-16 w-16 text-white/70/50" />
              <h3 className="mt-4 text-lg font-semibold">No tasks</h3>
              <p className="mt-2 text-sm text-white/70">
                {filter === 'active'
                  ? 'No active tasks. Great job!'
                  : filter === 'completed'
                  ? 'No completed tasks yet.'
                  : 'Create your first task to get started.'}
              </p>
            </div>
          </GlassCard>
        ) : (
          filteredTasks.map((task) => (
            <GlassCard
              key={task.id}
              className={`rounded-[16px] transition-all hover:shadow-md ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleComplete(task.id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle
                          className={`text-base font-semibold ${
                            task.completed ? 'line-through text-white/70' : ''
                          }`}
                        >
                          {task.title}
                        </CardTitle>
                        {task.description && (
                          <CardDescription className="mt-1 text-sm">
                            {task.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.dueDate && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDueDate(task.dueDate)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </GlassCard>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
