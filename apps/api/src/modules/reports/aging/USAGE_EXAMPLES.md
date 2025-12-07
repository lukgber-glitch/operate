# AR/AP Aging Reports - Usage Examples

## JavaScript/TypeScript Examples

### 1. Get AR Aging Report

```typescript
const axios = require('axios');

async function getARAgingReport(token: string, organizationId: string) {
  const response = await axios.get('https://operate.guru/api/v1/reports/ar-aging', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    params: {
      asOfDate: '2024-12-07',
      currency: 'EUR',
    },
  });

  const report = response.data;

  console.log('AR Aging Summary:');
  console.log(`Total Receivables: €${report.summary.totalReceivables}`);
  console.log(`Total Overdue: €${report.summary.totalOverdue}`);
  console.log(`Overdue %: ${report.summary.overduePercentage.toFixed(2)}%`);

  // Display aging buckets
  report.buckets.forEach(bucket => {
    console.log(`${bucket.label}: €${bucket.total} (${bucket.count} invoices)`);
  });

  // Display top 5 customers by receivables
  console.log('\nTop 5 Customers:');
  report.byCustomer.slice(0, 5).forEach((customer, index) => {
    console.log(`${index + 1}. ${customer.customerName}: €${customer.total}`);
  });

  return report;
}
```

### 2. Export AR Aging to CSV

```typescript
async function downloadARAgingCSV(token: string) {
  const response = await axios.get(
    'https://operate.guru/api/v1/reports/ar-aging/export/csv',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      responseType: 'blob',
    }
  );

  // Save to file (Node.js)
  const fs = require('fs');
  fs.writeFileSync('ar-aging.csv', response.data);

  console.log('CSV exported successfully to ar-aging.csv');
}
```

### 3. Export AR Aging to PDF

```typescript
async function downloadARAgingPDF(token: string) {
  const response = await axios.get(
    'https://operate.guru/api/v1/reports/ar-aging/export/pdf',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      responseType: 'blob',
    }
  );

  // Save to file (Node.js)
  const fs = require('fs');
  fs.writeFileSync('ar-aging.pdf', response.data);

  console.log('PDF exported successfully to ar-aging.pdf');
}
```

### 4. Get AP Aging Report

```typescript
async function getAPAgingReport(token: string) {
  const response = await axios.get('https://operate.guru/api/v1/reports/ap-aging', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    params: {
      asOfDate: '2024-12-07',
      currency: 'EUR',
    },
  });

  const report = response.data;

  console.log('AP Aging Summary:');
  console.log(`Total Payables: €${report.summary.totalPayables}`);
  console.log(`Total Overdue: €${report.summary.totalOverdue}`);
  console.log(`Overdue %: ${report.summary.overduePercentage.toFixed(2)}%`);

  // Display aging buckets
  report.buckets.forEach(bucket => {
    console.log(`${bucket.label}: €${bucket.total} (${bucket.count} bills)`);
  });

  // Display top 5 vendors by payables
  console.log('\nTop 5 Vendors:');
  report.byVendor.slice(0, 5).forEach((vendor, index) => {
    console.log(`${index + 1}. ${vendor.vendorName}: €${vendor.total}`);
  });

  return report;
}
```

### 5. Filter AR Aging by Customer

```typescript
async function getCustomerARAging(token: string, customerId: string) {
  const response = await axios.get('https://operate.guru/api/v1/reports/ar-aging', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    params: {
      customerId: customerId,
      asOfDate: '2024-12-07',
    },
  });

  const report = response.data;

  if (report.byCustomer.length > 0) {
    const customer = report.byCustomer[0];
    console.log(`Customer: ${customer.customerName}`);
    console.log(`Total Outstanding: €${customer.total}`);
    console.log(`Current: €${customer.current}`);
    console.log(`1-30 Days: €${customer.overdue30}`);
    console.log(`31-60 Days: €${customer.overdue60}`);
    console.log(`61-90 Days: €${customer.overdue90}`);
    console.log(`90+ Days: €${customer.overdue90Plus}`);
  }

  return report;
}
```

### 6. Analyze Overdue Invoices

```typescript
async function analyzeOverdueInvoices(token: string) {
  const response = await axios.get('https://operate.guru/api/v1/reports/ar-aging', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const report = response.data;

  // Get all overdue buckets (excluding "Current")
  const overdueBuckets = report.buckets.filter(b => b.minDays > 0);

  console.log('Overdue Analysis:');
  overdueBuckets.forEach(bucket => {
    console.log(`\n${bucket.label}:`);
    console.log(`  Total: €${bucket.total}`);
    console.log(`  Count: ${bucket.count} invoices`);

    // List individual invoices in this bucket
    bucket.invoices.forEach(inv => {
      console.log(`  - ${inv.customerName}: ${inv.invoiceNumber} - €${inv.amountDue} (${inv.daysOverdue} days)`);
    });
  });

  return overdueBuckets;
}
```

### 7. Compare AR and AP

```typescript
async function compareARvsAP(token: string) {
  const [arReport, apReport] = await Promise.all([
    axios.get('https://operate.guru/api/v1/reports/ar-aging', {
      headers: { 'Authorization': `Bearer ${token}` },
    }),
    axios.get('https://operate.guru/api/v1/reports/ap-aging', {
      headers: { 'Authorization': `Bearer ${token}` },
    }),
  ]);

  const ar = arReport.data;
  const ap = apReport.data;

  console.log('AR vs AP Comparison:');
  console.log(`\nReceivables: €${ar.summary.totalReceivables}`);
  console.log(`Payables: €${ap.summary.totalPayables}`);
  console.log(`Net Position: €${ar.summary.totalReceivables - ap.summary.totalPayables}`);

  console.log(`\nOverdue Receivables: €${ar.summary.totalOverdue} (${ar.summary.overduePercentage.toFixed(2)}%)`);
  console.log(`Overdue Payables: €${ap.summary.totalOverdue} (${ap.summary.overduePercentage.toFixed(2)}%)`);

  return { ar, ap };
}
```

## React Component Example

```tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ARAgingReport {
  summary: {
    totalReceivables: number;
    totalOverdue: number;
    overduePercentage: number;
  };
  buckets: Array<{
    label: string;
    total: number;
    count: number;
  }>;
  byCustomer: Array<{
    customerName: string;
    total: number;
    current: number;
    overdue30: number;
    overdue60: number;
    overdue90: number;
    overdue90Plus: number;
  }>;
}

export const ARAgingDashboard: React.FC = () => {
  const [report, setReport] = useState<ARAgingReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          'https://operate.guru/api/v1/reports/ar-aging',
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
        setReport(response.data);
      } catch (error) {
        console.error('Error fetching AR aging report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!report) return <div>Error loading report</div>;

  return (
    <div className="ar-aging-dashboard">
      <h1>Accounts Receivable Aging</h1>

      <div className="summary">
        <div className="metric">
          <h3>Total Receivables</h3>
          <p>€{report.summary.totalReceivables.toLocaleString()}</p>
        </div>
        <div className="metric">
          <h3>Total Overdue</h3>
          <p>€{report.summary.totalOverdue.toLocaleString()}</p>
        </div>
        <div className="metric">
          <h3>Overdue Percentage</h3>
          <p>{report.summary.overduePercentage.toFixed(2)}%</p>
        </div>
      </div>

      <div className="buckets">
        <h2>Aging Buckets</h2>
        {report.buckets.map(bucket => (
          <div key={bucket.label} className="bucket">
            <span>{bucket.label}</span>
            <span>€{bucket.total.toLocaleString()}</span>
            <span>({bucket.count} invoices)</span>
          </div>
        ))}
      </div>

      <div className="customers">
        <h2>Top Customers</h2>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Total</th>
              <th>Current</th>
              <th>1-30</th>
              <th>31-60</th>
              <th>61-90</th>
              <th>90+</th>
            </tr>
          </thead>
          <tbody>
            {report.byCustomer.slice(0, 10).map(customer => (
              <tr key={customer.customerName}>
                <td>{customer.customerName}</td>
                <td>€{customer.total.toLocaleString()}</td>
                <td>€{customer.current.toLocaleString()}</td>
                <td>€{customer.overdue30.toLocaleString()}</td>
                <td>€{customer.overdue60.toLocaleString()}</td>
                <td>€{customer.overdue90.toLocaleString()}</td>
                <td>€{customer.overdue90Plus.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## Python Example

```python
import requests
import pandas as pd
from datetime import datetime

def get_ar_aging_report(token, as_of_date=None):
    """Get AR Aging Report"""

    url = "https://operate.guru/api/v1/reports/ar-aging"
    headers = {"Authorization": f"Bearer {token}"}
    params = {}

    if as_of_date:
        params['asOfDate'] = as_of_date

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()

    return response.json()

def export_ar_aging_to_csv(token, filename='ar_aging.csv'):
    """Export AR Aging to CSV"""

    url = "https://operate.guru/api/v1/reports/ar-aging/export/csv"
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(url, headers=headers)
    response.raise_for_status()

    with open(filename, 'wb') as f:
        f.write(response.content)

    print(f"CSV exported to {filename}")

def analyze_ar_aging(token):
    """Analyze AR Aging Data"""

    report = get_ar_aging_report(token)

    print("AR Aging Summary")
    print("=" * 50)
    print(f"Total Receivables: €{report['summary']['totalReceivables']:,.2f}")
    print(f"Total Overdue: €{report['summary']['totalOverdue']:,.2f}")
    print(f"Overdue %: {report['summary']['overduePercentage']:.2f}%")
    print(f"Customers: {report['summary']['customerCount']}")
    print(f"Invoices: {report['summary']['invoiceCount']}")

    print("\nAging Buckets:")
    print("-" * 50)
    for bucket in report['buckets']:
        print(f"{bucket['label']:15s}: €{bucket['total']:10,.2f} ({bucket['count']:3d} invoices)")

    # Convert to pandas DataFrame for analysis
    customers_df = pd.DataFrame(report['byCustomer'])

    print("\nTop 5 Customers by Total Outstanding:")
    print("-" * 50)
    print(customers_df.head().to_string(index=False))

    return report

# Usage
if __name__ == "__main__":
    TOKEN = "your_auth_token_here"

    # Get and analyze report
    report = analyze_ar_aging(TOKEN)

    # Export to CSV
    export_ar_aging_to_csv(TOKEN)
```

## cURL Examples

### Get AR Aging Report
```bash
curl -X GET "https://operate.guru/api/v1/reports/ar-aging?asOfDate=2024-12-07" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Export to CSV
```bash
curl -X GET "https://operate.guru/api/v1/reports/ar-aging/export/csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output ar-aging.csv
```

### Export to PDF
```bash
curl -X GET "https://operate.guru/api/v1/reports/ar-aging/export/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output ar-aging.pdf
```

### Filter by Customer
```bash
curl -X GET "https://operate.guru/api/v1/reports/ar-aging?customerId=cust_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### AP Aging Report
```bash
curl -X GET "https://operate.guru/api/v1/reports/ap-aging?asOfDate=2024-12-07" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by Vendor
```bash
curl -X GET "https://operate.guru/api/v1/reports/ap-aging?vendorId=vendor_456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration Tips

1. **Caching**: Consider caching reports for a few minutes to reduce API load
2. **Scheduled Reports**: Set up cron jobs to generate and email reports daily/weekly
3. **Alerts**: Create alerts when overdue percentage exceeds threshold
4. **Visualization**: Use charting libraries (Chart.js, D3.js) to visualize aging data
5. **Export Automation**: Schedule automatic CSV/PDF exports to cloud storage
