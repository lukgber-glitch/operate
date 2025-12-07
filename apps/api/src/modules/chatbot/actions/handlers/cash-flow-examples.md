# Cash Flow Chat - Usage Examples

## How It Works

When a user asks about cash flow in the chat, the AI recognizes the intent and executes the appropriate action handler. The system processes the request and returns formatted financial information.

## Example Conversations

### Example 1: Basic Cash Flow Query

**User:** "Wie ist mein Cash Flow?"

**AI Response:**
```
Ich schaue mir Ihre aktuelle Finanzlage an.

[ACTION:get_cash_flow params={}]

💰 **Aktuelle Finanzübersicht**

**Kontostand:** €45.230,00
**Burn Rate:** €12.500,00/Monat
**Runway:** 3,6 Monate
**Prognose (30 Tage):** €32.730,00

⚡ **Hinweis:** Runway unter 6 Monaten. Bitte Einnahmen und Ausgaben prüfen.

**Zusammenfassung:**
• Erwartete Einnahmen: €20.000,00
• Erwartete Ausgaben: €32.500,00
• Netto-Veränderung: -€12.500,00

**Warnungen:**
⚠️ Niedrigster Punkt: €8.200 am 15. Januar
• 3 Rechnungen überfällig (€5.500)

**Empfehlungen:**
• Überfällige Rechnungen eintreiben (€5.500 möglich)
• Unnötige Abos prüfen (€890/Monat Einsparpotential)
• Großkunden-Zahlung beschleunigen

Möchten Sie eine detaillierte Prognose für 90 Tage sehen?
```

---

### Example 2: Runway Question

**User:** "Wann geht mir das Geld aus?"

**AI Response:**
```
Ich berechne Ihre Runway basierend auf den aktuellen Daten.

[ACTION:get_runway params={}]

📊 **Runway-Analyse**

Bei aktuellem Burn Rate von **€12.500,00/Monat**:

⚠️ **Runway:** 3,6 Monate (ca. April 2025)
**Status:** Vorsicht

**Finanzdetails:**
• Aktueller Kontostand: €45.230,00
• Durchschnittliche Einnahmen: €40.000,00/Monat
• Durchschnittliche Ausgaben: €52.500,00/Monat
• Netto pro Monat: -€12.500,00/Monat

**Empfehlungen:**
• Monitor cash flow closely
• Accelerate invoice collection
• Review and reduce discretionary spending
• Build cash reserves when possible

Bei Ihrem aktuellen Burn Rate haben Sie etwa 3,6 Monate Runway.
Soll ich Ihnen zeigen, wie Sie die Burn Rate reduzieren können?
```

---

### Example 3: Burn Rate Analysis

**User:** "Was ist meine Burn Rate?"

**AI Response:**
```
Ich analysiere Ihre monatlichen Ausgaben.

[ACTION:get_burn_rate params={}]

🔥 **Burn Rate Analyse**

**Monatliche Burn Rate:** €12.500,00
**Tägliche Burn Rate:** €416,67

**Details:**
• Durchschnittliche Einnahmen: €40.000,00/Monat
• Durchschnittliche Ausgaben: €52.500,00/Monat
• Netto pro Monat: -€12.500,00/Monat

📉 Sie verbrennen derzeit 27,6% Ihres Guthabens pro Monat.

⚠️ **WARNUNG:** Bei dieser Rate haben Sie nur noch 3,6 Monate Runway.

**Wie Sie Burn Rate reduzieren können:**
• Überprüfen Sie wiederkehrende Ausgaben
• Verhandeln Sie bessere Konditionen mit Lieferanten
• Identifizieren Sie unnötige Abonnements
• Optimieren Sie Betriebskosten

Ihre Burn Rate ist höher als Ihre Einnahmen. Möchten Sie Ihre größten
Ausgabenposten sehen?
```

---

### Example 4: Extended Forecast

**User:** "Zeig mir die Prognose für die nächsten 90 Tage"

**AI Response:**
```
Ich erstelle eine detaillierte 90-Tage-Prognose für Sie.

[ACTION:get_cash_forecast params={"days":90}]

📈 **Cash Flow Prognose (90 Tage)**

**Ausgangslage:**
• Aktueller Stand: €45.230,00
• Prognostizierter Stand: €7.730,00
• Veränderung: -€37.500,00
• Konfidenz: 72%

**Wichtige Events:**

**15.01.2025 (Mittwoch)**
  💰 Einnahmen: €15.000,00
  💸 Ausgaben: €2.500,00
  📊 Saldo: €57.730,00
     • Invoice INV-2024-123 - Acme Corp (€15.000,00)
     • Bill AWS-DEC - AWS (€2.500,00)

**22.01.2025 (Mittwoch)**
  💸 Ausgaben: €8.500,00
  📊 Saldo: €49.230,00
     • Payroll - January 2025 (€8.500,00)

**01.02.2025 (Samstag)**
  💰 Einnahmen: €5.000,00
  💸 Ausgaben: €12.000,00
  📊 Saldo: €42.230,00
     • Invoice INV-2025-001 - Beta GmbH (€5.000,00)
     • Bill RENT-FEB - Office Rent (€3.500,00)
     • Bill recurring subscriptions (€8.500,00)

**Wöchentliche Übersicht:**
✅ **Woche 1:** €12.500,00 (Einnahmen: €15.000,00, Ausgaben: €2.500,00)
⚠️ **Woche 2:** -€8.500,00 (Einnahmen: €0,00, Ausgaben: €8.500,00)
⚠️ **Woche 3:** -€7.000,00 (Einnahmen: €5.000,00, Ausgaben: €12.000,00)
✅ **Woche 4:** €3.000,00 (Einnahmen: €8.000,00, Ausgaben: €5.000,00)
...

**⚠️ Warnungen:**
🔴 KRITISCH: Balance projected to drop to €8.200 am 15. März
   → Urgent action needed: Secure additional funding or delay payments
⚠️ Large outflow of €12.000,00 expected on 01. Februar
   → Ensure sufficient funds are available

Basierend auf dieser Prognose wird Ihr Kontostand in 90 Tagen bei etwa
€7.730 liegen. Der niedrigste Punkt wird am 15. März mit €8.200 erreicht.

Möchten Sie eine Szenario-Analyse durchführen? Ich kann Ihnen zeigen,
wie sich verschiedene Maßnahmen auswirken würden.
```

---

### Example 5: English Query

**User:** "What's my runway?"

**AI Response:**
```
Let me calculate your runway based on current data.

[ACTION:get_runway params={}]

📊 **Runway Analysis**

At current burn rate of **€12,500.00/month**:

⚠️ **Runway:** 3.6 months (approx. April 2025)
**Status:** Caution

**Financial Details:**
• Current Balance: €45,230.00
• Average Monthly Income: €40,000.00/month
• Average Monthly Expenses: €52,500.00/month
• Net per Month: -€12,500.00/month

**Recommendations:**
• Monitor cash flow closely
• Accelerate invoice collection
• Review and reduce discretionary spending
• Build cash reserves when possible

At your current burn rate, you have approximately 3.6 months of runway.
Would you like to see how you can reduce your burn rate?
```

---

### Example 6: Follow-up Questions

**User:** "Wie ist mein Cash Flow?"

**AI:** [Shows cash flow overview]

**User:** "Welche Rechnungen sind überfällig?"

**AI Response:**
```
Basierend auf Ihrer Cash Flow Analyse haben Sie 3 überfällige Rechnungen
mit einem Gesamtwert von €5.500. Lassen Sie mich die Details abrufen.

[ACTION:list_invoices params={"status":"overdue"}]

**Überfällige Rechnungen:**

1. **INV-2024-098** - Müller GmbH
   - Betrag: €2.500,00
   - Fällig seit: 12.12.2024 (24 Tage überfällig)
   - Kunde: Guter Zahler (90% Pünktlichkeitsrate)

2. **INV-2024-102** - Schmidt KG
   - Betrag: €1.800,00
   - Fällig seit: 18.12.2024 (18 Tage überfällig)
   - Kunde: Durchschnittlicher Zahler (75% Pünktlichkeitsrate)

3. **INV-2024-107** - Weber AG
   - Betrag: €1.200,00
   - Fällig seit: 28.12.2024 (8 Tage überfällig)
   - Kunde: Neukunde (keine Historie)

**Gesamt:** €5.500,00

Soll ich Zahlungserinnerungen an diese Kunden senden?
```

---

## Implementation Notes

### Action Detection

The AI is trained to recognize various cash flow-related queries and map them to the appropriate action:

**Patterns for GET_CASH_FLOW:**
- "Wie ist mein Cash Flow?"
- "Zeig mir meine Finanzübersicht"
- "Wie steht es um meine Finanzen?"
- "How's my cash flow?"
- "Show me my financial overview"

**Patterns for GET_RUNWAY:**
- "Wie lange reicht mein Geld?"
- "Wann geht mir das Geld aus?"
- "Runway"
- "How long will my cash last?"
- "When will I run out of money?"

**Patterns for GET_BURN_RATE:**
- "Was ist meine Burn Rate?"
- "Wie viel gebe ich aus?"
- "Monatliche Ausgaben"
- "What's my burn rate?"
- "How much am I spending?"

**Patterns for GET_CASH_FORECAST:**
- "Prognose für X Tage"
- "Forecast"
- "Was passiert in den nächsten X Tagen?"
- "X-day forecast"
- "What will happen in the next X days?"

### Response Customization

Responses are dynamically customized based on:
1. **Financial Status:**
   - Healthy: Positive messages, investment suggestions
   - Caution: Warning indicators, monitoring advice
   - Critical: Urgent warnings, immediate action items

2. **Data Availability:**
   - Rich data: Detailed projections, high confidence
   - Limited data: General trends, lower confidence
   - No data: Onboarding guidance, setup instructions

3. **User Role:**
   - Admin/Accountant: Full details, technical metrics
   - Employee: Limited access (permission denied)

### Multi-turn Conversations

The system supports follow-up questions:
```
User: "Wie ist mein Cash Flow?"
AI: [Shows overview with alerts]

User: "Was kann ich gegen die niedrige Runway tun?"
AI: [Provides specific recommendations]

User: "Zeig mir die größten Ausgaben"
AI: [Lists top expenses from cash flow data]

User: "Erstelle eine Rechnung für Acme Corp"
AI: [Switches context to invoice creation]
```

### Error Handling

**Scenario:** No bank accounts connected
```
AI: Ich kann Ihren Cash Flow leider nicht berechnen, da noch keine
Bankkonten verbunden sind.

**So verbinden Sie ein Bankkonto:**
1. Gehen Sie zu Einstellungen > Banking
2. Klicken Sie auf "Bankkonto verbinden"
3. Wählen Sie Ihre Bank aus
4. Autorisieren Sie die Verbindung

Sobald Transaktionen importiert wurden, kann ich Ihnen eine detaillierte
Cash Flow Analyse bereitstellen.
```

**Scenario:** Permission denied
```
AI: Leider habe ich keine Berechtigung, Cash Flow Berichte für Sie zu
erstellen. Bitte wenden Sie sich an Ihren Administrator, um die
Berechtigung "reports:generate" zu erhalten.
```

## Integration with Other Features

### Proactive Suggestions
The cash flow handlers can trigger proactive suggestions:
- Daily cash flow summary (if runway < 6 months)
- Weekly forecast email
- Critical balance alerts

### Dashboard Integration
Response data can populate dashboard widgets:
- Runway meter
- Burn rate chart
- Cash flow projection graph

### Export Options
Future enhancement - responses can be exported as:
- PDF reports
- Excel spreadsheets
- Email summaries
