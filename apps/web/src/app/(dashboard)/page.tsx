import { TrendingUp, Users, FileText, CreditCard, CheckCircle2, Camera } from 'lucide-react'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Welcome back! Here is an overview of your business operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value="156"
          change="+12"
          changeLabel="from last month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Active Documents"
          value="2,847"
          change="+156"
          changeLabel="from last month"
          icon={FileText}
          trend="up"
        />
        <StatCard
          title="Monthly Revenue"
          value="€45,231"
          change="+8.2%"
          changeLabel="from last month"
          icon={CreditCard}
          trend="up"
        />
        <StatCard
          title="Completion Rate"
          value="94.5%"
          change="+2.1%"
          changeLabel="from last month"
          icon={CheckCircle2}
          trend="up"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button className="justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Add New Employee
            </Button>
            <Button className="justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
            <Button className="justify-start" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button className="justify-start" variant="outline" asChild>
              <Link href="/finance/expenses/scan">
                <Camera className="mr-2 h-4 w-4" />
                Scan Receipt
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ActivityItem
              title="New employee onboarded"
              description="Sarah Johnson joined the team"
              time="2 hours ago"
            />
            <ActivityItem
              title="Invoice approved"
              description="Invoice #INV-2024-0123 approved"
              time="5 hours ago"
            />
            <ActivityItem
              title="Document uploaded"
              description="Q4 2024 Financial Report"
              time="1 day ago"
            />
            <ActivityItem
              title="Tax filing completed"
              description="VAT return submitted successfully"
              time="2 days ago"
            />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>
            Tasks and deadlines requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TaskItem
              title="VAT Filing Deadline"
              description="Submit monthly VAT return"
              dueDate="In 3 days"
              priority="high"
            />
            <TaskItem
              title="Quarterly Review"
              description="Review Q1 financial statements"
              dueDate="In 5 days"
              priority="medium"
            />
            <TaskItem
              title="Employee Contracts"
              description="Renew 5 employee contracts"
              dueDate="In 1 week"
              priority="medium"
            />
            <TaskItem
              title="Expense Reports"
              description="Review and approve pending expense reports"
              dueDate="In 2 weeks"
              priority="low"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  changeLabel: string
  icon: typeof Users
  trend: 'up' | 'down'
}

function StatCard({ title, value, change, changeLabel, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </div>
        <p className="mt-1 flex items-center text-xs text-slate-600 dark:text-slate-400">
          <span className={trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {change}
          </span>
          <span className="ml-1">{changeLabel}</span>
        </p>
      </CardContent>
    </Card>
  )
}

interface ActivityItemProps {
  title: string
  description: string
  time: string
}

function ActivityItem({ title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
      <div className="flex h-2 w-2 mt-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {title}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap">
        {time}
      </span>
    </div>
  )
}

interface TaskItemProps {
  title: string
  description: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
}

function TaskItem({ title, description, dueDate, priority }: TaskItemProps) {
  const priorityColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  }

  return (
    <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {title}
          </p>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[priority]}`}>
            {priority}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap">
        <TrendingUp className="h-3 w-3" />
        {dueDate}
      </div>
    </div>
  )
}
