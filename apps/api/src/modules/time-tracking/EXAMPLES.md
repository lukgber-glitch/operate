# Time Tracking API Examples

## Authentication

All requests require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Projects

### Create a Project

```bash
POST /api/v1/projects
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Complete redesign of corporate website",
  "clientId": "clt_123456",
  "color": "#3b82f6",
  "budgetHours": 120,
  "budgetAmount": 12000,
  "hourlyRate": 100,
  "currency": "EUR",
  "status": "ACTIVE",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31"
}
```

### List All Projects

```bash
GET /api/v1/projects
```

Response:
```json
[
  {
    "id": "prj_123456",
    "name": "Website Redesign",
    "status": "ACTIVE",
    "client": {
      "id": "clt_123456",
      "name": "Acme Corp",
      "clientNumber": "CLT-001"
    },
    "_count": {
      "billableTimeEntries": 15
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Project with Summary

```bash
GET /api/v1/projects/prj_123456
```

Response:
```json
{
  "id": "prj_123456",
  "name": "Website Redesign",
  "budgetHours": 120,
  "hourlyRate": 100,
  "billableTimeEntries": [...],
  "summary": {
    "totalHours": 45.5,
    "totalMinutes": 2730
  }
}
```

### Get Project Profitability

```bash
GET /api/v1/projects/prj_123456/profitability
```

Response:
```json
{
  "projectId": "prj_123456",
  "projectName": "Website Redesign",
  "totalHours": 45.5,
  "totalRevenue": 4550,
  "budgetAmount": 12000,
  "budgetHours": 120,
  "budgetRemaining": 7450,
  "budgetHoursRemaining": 74.5,
  "percentComplete": 37.92
}
```

## Time Entries

### Start a Timer

```bash
POST /api/v1/time-entries/start
Content-Type: application/json

{
  "projectId": "prj_123456",
  "description": "Frontend development",
  "billable": true,
  "hourlyRate": 100
}
```

Response:
```json
{
  "id": "te_123456",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": null,
  "duration": null,
  "billable": true,
  "project": {
    "id": "prj_123456",
    "name": "Website Redesign"
  }
}
```

### Get Running Timer

```bash
GET /api/v1/time-entries/running
```

### Stop Timer

```bash
POST /api/v1/time-entries/te_123456/stop
```

Response:
```json
{
  "id": "te_123456",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:30:00Z",
  "duration": 150,
  "billable": true,
  "hourlyRate": 100
}
```

### Create Manual Time Entry

```bash
POST /api/v1/time-entries
Content-Type: application/json

{
  "projectId": "prj_123456",
  "description": "Backend API development",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T18:00:00Z",
  "billable": true,
  "hourlyRate": 100
}
```

### List Time Entries with Filters

```bash
# Filter by project
GET /api/v1/time-entries?projectId=prj_123456

# Filter by date range
GET /api/v1/time-entries?startDate=2024-01-01&endDate=2024-01-31

# Filter by billable status
GET /api/v1/time-entries?billable=true&billed=false

# Combine filters
GET /api/v1/time-entries?projectId=prj_123456&startDate=2024-01-01&billable=true
```

### Update Time Entry

```bash
PATCH /api/v1/time-entries/te_123456
Content-Type: application/json

{
  "description": "Updated description",
  "billable": false
}
```

### Delete Time Entry

```bash
DELETE /api/v1/time-entries/te_123456
```

## Summaries and Reports

### Get Time Summary

```bash
# Summary for date range
GET /api/v1/time-entries/summary?startDate=2024-01-01&endDate=2024-01-31

# Summary for specific period
GET /api/v1/time-entries/summary?startDate=2024-01-01&endDate=2024-01-31&period=week
```

Response:
```json
{
  "totalHours": 160,
  "billableHours": 145,
  "totalRevenue": 14500,
  "entryCount": 32
}
```

### Get Unbilled Billable Hours

```bash
# All unbilled hours
GET /api/v1/time-entries/billable

# Unbilled hours for specific client
GET /api/v1/time-entries/billable?clientId=clt_123456
```

Response:
```json
{
  "entries": [
    {
      "id": "te_123456",
      "startTime": "2024-01-15T09:00:00Z",
      "duration": 150,
      "billable": true,
      "billed": false,
      "hourlyRate": 100,
      "project": {
        "id": "prj_123456",
        "name": "Website Redesign"
      }
    }
  ],
  "totalHours": 45.5,
  "totalRevenue": 4550,
  "entryCount": 15
}
```

## Invoice Generation

### Generate Invoice from Time Entries

```bash
POST /api/v1/time-entries/generate-invoice
Content-Type: application/json

{
  "entryIds": [
    "te_123456",
    "te_123457",
    "te_123458"
  ]
}
```

Response:
```json
{
  "clientId": "clt_123456",
  "lineItems": [
    {
      "description": "Website Redesign - Time tracked",
      "quantity": 45.5,
      "unitPrice": 100,
      "amount": 4550
    }
  ],
  "timeEntryIds": [
    "te_123456",
    "te_123457",
    "te_123458"
  ]
}
```

Note: After generating the invoice, the time entries are marked as `billed: true`.

## Common Workflows

### Workflow 1: Daily Time Tracking

1. Start work: `POST /time-entries/start`
2. Take break: `POST /time-entries/:id/stop`
3. Resume: `POST /time-entries/start`
4. End day: `POST /time-entries/:id/stop`
5. Review: `GET /time-entries/summary`

### Workflow 2: Manual Time Entry

1. Create entry: `POST /time-entries` with startTime and endTime
2. System auto-calculates duration
3. Entry is ready for billing

### Workflow 3: Monthly Invoicing

1. Get unbilled hours: `GET /time-entries/billable?clientId=clt_123`
2. Review entries
3. Generate invoice: `POST /time-entries/generate-invoice`
4. Create invoice in billing system (use returned data)

### Workflow 4: Project Budget Tracking

1. Create project with budget: `POST /projects`
2. Track time: Multiple time entries
3. Check status: `GET /projects/:id/profitability`
4. Monitor budget consumption

## Error Responses

### Already have a running timer
```json
{
  "statusCode": 409,
  "message": "You already have a running timer"
}
```

### Timer already stopped
```json
{
  "statusCode": 400,
  "message": "Timer is already stopped"
}
```

### Project not found
```json
{
  "statusCode": 404,
  "message": "Project with ID prj_123456 not found"
}
```

### Cannot delete project with entries
```json
{
  "statusCode": 409,
  "message": "Cannot delete project with existing time entries"
}
```

### Mixed client entries for invoice
```json
{
  "statusCode": 400,
  "message": "All time entries must belong to the same client"
}
```

## Tips

1. **Timer Management**: Only one timer can run at a time per user
2. **Duration Calculation**: Duration is auto-calculated when stopping timer or creating entries with both start and end times
3. **Hourly Rates**: Entry-level rates override project-level rates
4. **Billing**: Mark entries as non-billable for internal work
5. **Invoice Generation**: Automatically marks entries as billed and groups by project
6. **Filters**: Combine multiple filters for precise queries
7. **Date Ranges**: Use ISO 8601 format for dates (YYYY-MM-DD)
