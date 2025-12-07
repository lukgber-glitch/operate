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
          value="0"
          change=""
          changeLabel="No data yet"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Active Documents"
          value="0"
          change=""
          changeLabel="No data yet"
          icon={FileText}
          trend="up"
        />
        <StatCard
          title="Monthly Revenue"
          value="€0"
          change=""
          changeLabel="No data yet"
          icon={CreditCard}
          trend="up"
        />
        <StatCard
          title="Completion Rate"
          value="0%"
          change=""
          changeLabel="No data yet"
          icon={CheckCircle2}
          trend="up"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card role="region" aria-labelledby="quick-actions-heading">
          <CardHeader>
            <CardTitle id="quick-actions-heading">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button className="justify-start" variant="outline" aria-label="Add new employee">
              <Users className="mr-2 h-4 w-4" aria-hidden="true" />
              Add New Employee
            </Button>
            <Button className="justify-start" variant="outline" aria-label="Upload document">
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              Upload Document
            </Button>
            <Button className="justify-start" variant="outline" aria-label="Create invoice">
              <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Invoice
            </Button>
            <Button className="justify-start" variant="outline" asChild>
              <Link href="/finance/expenses/scan" aria-label="Scan receipt">
                <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                Scan Receipt
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card role="region" aria-labelledby="recent-activity-heading">
          <CardHeader>
            <CardTitle id="recent-activity-heading">Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" role="feed" aria-label="Recent activity feed">
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
              <p className="text-sm">Your activity will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card role="region" aria-labelledby="upcoming-tasks-heading">
        <CardHeader>
          <CardTitle id="upcoming-tasks-heading">Upcoming Tasks</CardTitle>
          <CardDescription>
            Tasks and deadlines requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No upcoming tasks</p>
            <p className="text-sm">Your tasks will appear here</p>
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
    <Card role="region" aria-label={`${title} statistics`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white" aria-label={`${title}: ${value}`}>
          {value}
        </div>
        <p className="mt-1 flex items-center text-xs text-slate-600 dark:text-slate-400">
          {change && (
            <span className={trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {change}
            </span>
          )}
          <span className={change ? 'ml-1' : ''}>{changeLabel}</span>
        </p>
      </CardContent>
    </Card>
  )
}
