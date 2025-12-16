# Algorithm Specifications
## Technical Documentation for Patent Claims

---

## ALGORITHM #1: Multi-Factor Invoice Matching

### Pseudocode

```
FUNCTION matchPaymentToInvoice(payment, organizationId):
    // Step 1: Find potential matches
    openInvoices = findOpenInvoices(organizationId, maxAgeDays=90)

    IF openInvoices.length == 0:
        RETURN { matched: false, action: CREATE_CUSTOMER }

    // Step 2: Score each invoice
    matches = []
    FOR EACH invoice IN openInvoices:
        score = scoreInvoiceMatch(invoice, payment)
        IF score.confidence > 30:
            matches.append(score)

    // Step 3: Sort by confidence
    matches.sortBy(confidence, DESCENDING)
    bestMatch = matches[0]

    // Step 4: Determine action based on confidence
    IF bestMatch.matchType == EXACT AND bestMatch.confidence >= 95:
        action = AUTO_RECONCILE
    ELSE IF bestMatch.matchType == PARTIAL:
        action = PARTIAL_PAYMENT
    ELSE IF bestMatch.confidence >= 70:
        action = REVIEW
    ELSE:
        action = NO_MATCH

    // Step 5: Check multi-invoice scenario
    IF payment.amount > bestMatch.invoice.totalAmount:
        multiMatch = checkMultiInvoiceMatch(payment, matches)
        IF multiMatch:
            RETURN multiMatch

    RETURN { matched: true, invoice: bestMatch.invoice, confidence, action }


FUNCTION scoreInvoiceMatch(invoice, payment):
    totalConfidence = 0
    weightSum = 0
    reasons = []

    // Factor 1: Amount (40% weight)
    amountMatch = matchAmount(payment.amount, invoice.totalAmount)
    totalConfidence += amountMatch.confidence * 0.40
    weightSum += 0.40
    IF amountMatch.matches:
        reasons.append(amountMatch.reason)

    // Factor 2: Reference (30% weight)
    refMatch = matchReference(invoice.number, payment.description)
    IF refMatch.matches:
        totalConfidence += refMatch.confidence * 0.30
        weightSum += 0.30
        reasons.append(refMatch.reason)

    // Factor 3: Name (25% weight)
    IF payment.counterparty AND invoice.customerName:
        nameMatch = fuzzyMatchNames(payment.counterparty, invoice.customerName)
        IF nameMatch.matches:
            totalConfidence += nameMatch.confidence * 0.25
            weightSum += 0.25
            reasons.append(nameMatch.reason)

    // Factor 4: Date (5% weight)
    daysSinceIssue = daysBetween(invoice.issueDate, payment.date)
    IF daysSinceIssue >= 0 AND daysSinceIssue <= 90:
        dateConfidence = MAX(100 - daysSinceIssue, 50)
        totalConfidence += dateConfidence * 0.05
        weightSum += 0.05
        reasons.append("Payment " + daysSinceIssue + " days after invoice")

    // Normalize confidence
    finalConfidence = ROUND(totalConfidence / weightSum)

    RETURN { confidence: finalConfidence, reasons }


FUNCTION matchAmount(paymentAmount, invoiceAmount):
    difference = ABS(paymentAmount - invoiceAmount)
    tolerance = MAX(invoiceAmount * 0.01, 100)  // 1% or €1

    IF difference <= tolerance:
        confidence = 100 - (difference / tolerance * 10)
        RETURN { matches: true, matchType: EXACT, confidence }
    ELSE IF paymentAmount < invoiceAmount:
        partialPercent = paymentAmount / invoiceAmount * 100
        IF partialPercent >= 25:
            RETURN { matches: true, matchType: PARTIAL, confidence: partialPercent }

    RETURN { matches: false, confidence: 0 }


FUNCTION matchReference(invoiceNumber, description):
    patterns = [
        /INV-?\d+/i,
        /RE-?\d+/i,
        /BILL-?\d+/i,
        /RG-?\d+/i,
        /FAC-?\d+/i,
        /#\d{4,}/,
        /\b\d{6,}\b/
    ]

    FOR EACH pattern IN patterns:
        IF pattern.match(description) AND description.contains(invoiceNumber):
            RETURN { matches: true, confidence: 100 }
        ELSE IF pattern.match(description):
            RETURN { matches: true, confidence: 70 }

    RETURN { matches: false, confidence: 0 }


FUNCTION fuzzyMatchNames(name1, name2):
    normalized1 = normalizeName(name1)
    normalized2 = normalizeName(name2)

    distance = levenshteinDistance(normalized1, normalized2)
    maxLength = MAX(normalized1.length, normalized2.length)
    similarity = 1 - (distance / maxLength)

    IF similarity >= 0.80:
        confidence = similarity * 100
        RETURN { matches: true, confidence }

    RETURN { matches: false, confidence: 0 }
```

### Mathematical Formulas

**Confidence Score:**
$$C = \frac{(A \times 0.40) + (R \times 0.30) + (N \times 0.25) + (D \times 0.05)}{W}$$

Where:
- $C$ = Final confidence score (0-100)
- $A$ = Amount match confidence (0-100)
- $R$ = Reference match confidence (0-100)
- $N$ = Name match confidence (0-100)
- $D$ = Date proximity confidence (0-100)
- $W$ = Sum of applicable weights (varies based on available factors)

**Amount Tolerance:**
$$T = max(\text{invoiceAmount} \times 0.01, 1.00)$$

**Name Similarity (Levenshtein):**
$$S = 1 - \frac{d(s_1, s_2)}{max(|s_1|, |s_2|)}$$

Where $d(s_1, s_2)$ is the Levenshtein edit distance.

---

## ALGORITHM #2: Tax-Aware Transaction Classification

### Pseudocode

```
FUNCTION classifyTransaction(transaction, organizationId):
    startTime = now()

    // Step 1: Check learned patterns (highest priority)
    IF organizationId:
        learnedClassification = applyLearnedPatterns(transaction, organizationId)
        IF learnedClassification AND learnedClassification.confidence >= 0.95:
            RETURN learnedClassification

    // Step 2: Check vendor pattern (fast path)
    vendorPattern = findVendorPattern(transaction.description)

    // Step 3: Check database vendor match
    matchedVendor = NULL
    IF organizationId AND transaction.counterparty:
        matchedVendor = findMatchingVendor(transaction.counterparty, organizationId)

    // Step 4: AI Classification
    prompt = buildClassificationPrompt(transaction, learnedClassification, matchedVendor)
    aiResponse = claudeAPI.promptJson(prompt, {
        system: TAX_CLASSIFICATION_SYSTEM_PROMPT,
        maxTokens: 2048,
        temperature: 0.1  // Low for consistency
    })

    // Step 5: Enhance with patterns
    IF vendorPattern AND aiResponse.confidence < 0.7:
        aiResponse.taxCategory = vendorPattern.taxCategory
        aiResponse.vendor = vendorPattern.vendorName
        aiResponse.isRecurring = vendorPattern.recurring

    // Step 6: Apply EÜR rules
    eurInfo = getEurLineInfo(aiResponse.taxCategory)
    deductibleAmount = calculateDeductibleAmount(transaction.amount, aiResponse.taxCategory)

    // Step 7: Validate and add flags
    classification = {
        category: aiResponse.category,
        confidence: aiResponse.confidence,
        tax: {
            deductible: TRUE,
            deductionPercentage: eurInfo.deductionPercentage,
            deductibleAmount: deductibleAmount,
            vatReclaimable: aiResponse.vatReclaimable,
            taxCategory: aiResponse.taxCategory,
            eurLineNumber: eurInfo.lineNumber,
            eurDescription: eurInfo.germanDescription
        },
        business: {
            isBusinessExpense: TRUE,
            businessPercentage: aiResponse.businessPercentage,
            requiresDocumentation: eurInfo.requiresDocumentation
        },
        pattern: {
            isRecurring: aiResponse.isRecurring,
            vendor: extractVendorName(transaction.description)
        },
        flags: {}
    }

    // Add review flags
    IF classification.confidence < 0.85:
        classification.flags.needsReview = TRUE

    IF ABS(transaction.amount) > 500000:  // > €5000
        classification.flags.unusualAmount = TRUE
        classification.flags.needsReview = TRUE

    RETURN classification


FUNCTION calculateDeductibleAmount(amount, taxCategory):
    absAmount = ABS(amount)

    // Apply German EÜR deduction rules
    SWITCH taxCategory:
        CASE BEWIRTUNG:
            // Business meals: 70% deductible
            RETURN absAmount * 0.70

        CASE TELEFON_INTERNET:
            // Phone/Internet: 50% default business share
            RETURN absAmount * 0.50

        CASE GESCHENKE:
            // Gifts: €35/person/year limit
            IF absAmount <= 3500:
                RETURN absAmount
            ELSE:
                RETURN 3500

        CASE PRIVATE_ENTNAHME:
            // Private: 0% deductible
            RETURN 0

        DEFAULT:
            // Most categories: 100% deductible
            RETURN absAmount


FUNCTION getEurLineInfo(taxCategory):
    EUR_MAPPING = {
        EINNAHMEN_19: { lineNumber: 12, percentage: 100, description: "Betriebseinnahmen 19%" },
        EINNAHMEN_7: { lineNumber: 13, percentage: 100, description: "Betriebseinnahmen 7%" },
        EINNAHMEN_STEUERFREI: { lineNumber: 14, percentage: 100, description: "Steuerfreie Einnahmen" },
        WARENEINKAUF: { lineNumber: 16, percentage: 100, description: "Wareneinkauf" },
        FREMDLEISTUNGEN: { lineNumber: 17, percentage: 100, description: "Fremdleistungen" },
        PERSONALKOSTEN: { lineNumber: 18, percentage: 100, description: "Personalkosten" },
        ABSCHREIBUNGEN: { lineNumber: 19, percentage: 100, description: "Abschreibungen" },
        RAUMKOSTEN: { lineNumber: 20, percentage: 100, description: "Raumkosten" },
        SONSTIGE_KOSTEN: { lineNumber: 21, percentage: 100, description: "Sonstige Kosten" },
        KFZ_KOSTEN: { lineNumber: 22, percentage: variable, description: "Kfz-Kosten" },
        REISEKOSTEN: { lineNumber: 23, percentage: 100, description: "Reisekosten" },
        BEWIRTUNG: { lineNumber: 24, percentage: 70, description: "Bewirtungskosten", requiresDocumentation: TRUE },
        WERBUNG: { lineNumber: 25, percentage: 100, description: "Werbekosten" },
        GESCHENKE: { lineNumber: 26, percentage: limited, description: "Geschenke" },
        BUEROKOSTEN: { lineNumber: 27, percentage: 100, description: "Bürokosten" },
        TELEFON_INTERNET: { lineNumber: 28, percentage: 50, description: "Telefon/Internet" },
        MIETE_PACHT: { lineNumber: 29, percentage: 100, description: "Miete und Pacht" },
        VERSICHERUNGEN: { lineNumber: 30, percentage: 100, description: "Versicherungen" },
        ZINSEN: { lineNumber: 31, percentage: 100, description: "Schuldzinsen" },
        SONSTIGE_BETRIEBSAUSGABEN: { lineNumber: 32, percentage: 100, description: "Sonstige Betriebsausgaben" }
    }

    RETURN EUR_MAPPING[taxCategory]


FUNCTION learnFromCorrection(transactionId, orgId, userId, correctCategory, correctTaxCategory, originalClassification, transaction):
    // Store correction record
    createCorrectionRecord({
        organisationId: orgId,
        entityType: 'transaction',
        entityId: transactionId,
        originalValue: {
            category: originalClassification.category,
            taxCategory: originalClassification.tax.taxCategory
        },
        correctedValue: {
            category: correctCategory,
            taxCategory: correctTaxCategory
        },
        userId: userId
    })

    // Extract and store pattern
    vendor = extractVendorName(transaction.description)
    normalizedVendor = vendor.toLowerCase().replace(/\s+/g, '-')

    existingPattern = findPattern(orgId, 'vendor_category', normalizedVendor)

    IF existingPattern:
        // Update accuracy based on correction
        newOccurrences = existingPattern.occurrences + 1
        IF existingPattern.adjustment.category == correctCategory:
            newAccuracy = MIN(1.0, existingPattern.accuracy + 0.1)
        ELSE:
            newAccuracy = MAX(0.5, existingPattern.accuracy - 0.1)

        updatePattern(existingPattern.id, {
            adjustment: { category: correctCategory, taxCategory: correctTaxCategory },
            occurrences: newOccurrences,
            accuracy: newAccuracy
        })
    ELSE:
        createPattern({
            organisationId: orgId,
            patternType: 'vendor_category',
            condition: { vendor: normalizedVendor },
            adjustment: { category: correctCategory, taxCategory: correctTaxCategory },
            occurrences: 1,
            accuracy: 1.0,
            isActive: TRUE
        })
```

### Mathematical Formulas

**Pattern Accuracy Update:**
$$A_{new} = \begin{cases}
min(1.0, A_{old} + 0.1) & \text{if correction matches pattern} \\
max(0.5, A_{old} - 0.1) & \text{if correction differs from pattern}
\end{cases}$$

**Deductible Amount:**
$$D = A \times P$$

Where:
- $D$ = Deductible amount
- $A$ = Absolute transaction amount
- $P$ = Deduction percentage based on tax category

---

## ALGORITHM #3: Recurring Transaction Detection

### Pseudocode

```
FUNCTION detectRecurringTransactions(organizationId, options):
    opts = {
        minOccurrences: options.minOccurrences OR 2,
        lookbackDays: options.lookbackDays OR 365,
        minConfidence: options.minConfidence OR 60,
        activeOnly: options.activeOnly OR FALSE
    }

    // Step 1: Fetch debit transactions
    lookbackDate = subtractDays(now(), opts.lookbackDays)
    transactions = fetchDebitTransactions(organizationId, lookbackDate)

    // Step 2: Group by vendor
    vendorGroups = groupByVendor(transactions)

    // Step 3: Analyze each group
    patterns = []
    FOR EACH group IN vendorGroups:
        IF group.transactions.length < opts.minOccurrences:
            CONTINUE

        pattern = analyzeVendorGroup(group)

        IF pattern AND pattern.confidence >= opts.minConfidence:
            IF opts.activeOnly AND NOT pattern.isActive:
                CONTINUE
            patterns.append(pattern)

    // Step 4: Sort by annual cost
    patterns.sortBy(calculateAnnualCost, DESCENDING)

    RETURN patterns


FUNCTION groupByVendor(transactions):
    groups = Map()

    FOR EACH tx IN transactions:
        vendorName = tx.counterpartyName OR extractVendorName(tx.description)
        normalized = normalizeVendorName(vendorName)

        // Find existing group with fuzzy matching
        groupKey = normalized
        FOR EACH [existingKey, existingGroup] IN groups:
            similarity = calculateSimilarity(normalized, existingKey)
            IF similarity > 0.85:  // 85% threshold
                groupKey = existingKey
                BREAK

        IF NOT groups.has(groupKey):
            groups.set(groupKey, {
                normalizedName: groupKey,
                nameVariations: [],
                transactions: [],
                currency: tx.currency
            })

        group = groups.get(groupKey)
        IF vendorName NOT IN group.nameVariations:
            group.nameVariations.append(vendorName)

        group.transactions.append(tx)

    RETURN groups.values()


FUNCTION analyzeVendorGroup(group):
    IF group.transactions.length < 2:
        RETURN NULL

    // Sort by date
    sortedTxs = group.transactions.sortBy(date, ASCENDING)

    // Analyze intervals
    intervalAnalysis = analyzeIntervals(sortedTxs.map(tx => tx.date))

    IF intervalAnalysis.frequency == 'irregular':
        RETURN NULL

    // Calculate amount statistics
    amounts = sortedTxs.map(tx => tx.amount)
    averageAmount = SUM(amounts) / amounts.length
    minAmount = MIN(amounts)
    maxAmount = MAX(amounts)
    amountStdDev = calculateStdDev(amounts)

    // Check if active
    lastTx = sortedTxs[sortedTxs.length - 1]
    daysSinceLastPayment = daysBetween(lastTx.date, now())
    expectedGap = intervalAnalysis.averageGapDays
    isActive = daysSinceLastPayment <= expectedGap * 2

    // Determine status
    status = 'confirmed'
    IF sortedTxs.length == 2:
        status = 'predicted'
    ELSE IF NOT isActive:
        status = 'ended'

    // Get category from known patterns
    category = lookupSubscriptionCategory(group.normalizedName)

    RETURN {
        vendorName: group.nameVariations[0],
        normalizedVendorName: group.normalizedName,
        frequency: intervalAnalysis.frequency,
        averageAmount: ROUND(averageAmount),
        minAmount: ROUND(minAmount),
        maxAmount: ROUND(maxAmount),
        occurrences: sortedTxs.length,
        firstSeen: sortedTxs[0].date,
        lastSeen: lastTx.date,
        nextExpected: intervalAnalysis.expectedNextDate,
        confidence: intervalAnalysis.confidence,
        category: category,
        isActive: isActive,
        status: status
    }


FUNCTION analyzeIntervals(dates):
    IF dates.length < 2:
        RETURN { frequency: 'irregular', confidence: 0 }

    // Calculate gaps between consecutive transactions
    gaps = []
    FOR i = 1 TO dates.length - 1:
        gaps.append(daysBetween(dates[i-1], dates[i]))

    averageGap = SUM(gaps) / gaps.length
    stdDev = calculateStdDev(gaps)

    // Calculate confidence using coefficient of variation
    coefficientOfVariation = stdDev / averageGap
    confidence = MAX(0, MIN(100, 100 - coefficientOfVariation * 100))

    // Determine frequency based on average gap
    frequency = 'irregular'
    expectedNextDate = dates[dates.length - 1]

    IF averageGap >= 4 AND averageGap <= 10:
        frequency = 'weekly'
        expectedNextDate = addWeeks(expectedNextDate, 1)

    ELSE IF averageGap >= 10 AND averageGap <= 18:
        frequency = 'bi-weekly'
        expectedNextDate = addWeeks(expectedNextDate, 2)

    ELSE IF averageGap >= 23 AND averageGap <= 36:
        frequency = 'monthly'
        expectedNextDate = addMonths(expectedNextDate, 1)

    ELSE IF averageGap >= 80 AND averageGap <= 100:
        frequency = 'quarterly'
        expectedNextDate = addQuarters(expectedNextDate, 1)

    ELSE IF averageGap >= 350 AND averageGap <= 380:
        frequency = 'yearly'
        expectedNextDate = addYears(expectedNextDate, 1)

    RETURN {
        frequency: frequency,
        averageGapDays: averageGap,
        standardDeviation: stdDev,
        confidence: ROUND(confidence),
        expectedNextDate: expectedNextDate
    }


FUNCTION normalizeVendorName(name):
    // Remove legal entity suffixes
    suffixes = ['gmbh', 'ag', 'ltd', 'limited', 'inc', 'corp', 'llc', 'bv', 'sa', 'srl', 'se', 'plc', 'kg', 'ug', 'ohg', 'gbr', 'ev']
    normalized = name.toLowerCase()

    FOR EACH suffix IN suffixes:
        normalized = normalized.replace(REGEX('\\b' + suffix + '\\b', 'gi'), '')

    // Remove special characters
    normalized = normalized.replace(/[^a-z0-9\s]/g, '')
    normalized = normalized.replace(/\s+/g, ' ').trim()

    RETURN normalized


FUNCTION calculateSimilarity(str1, str2):
    maxLen = MAX(str1.length, str2.length)
    IF maxLen == 0:
        RETURN 1

    distance = levenshteinDistance(str1, str2)
    RETURN 1 - (distance / maxLen)


FUNCTION calculateStdDev(values):
    IF values.length == 0:
        RETURN 0

    avg = SUM(values) / values.length
    squareDiffs = values.map(val => (val - avg)^2)
    variance = SUM(squareDiffs) / values.length

    RETURN SQRT(variance)
```

### Mathematical Formulas

**Confidence Score (Inverse Coefficient of Variation):**
$$C = max(0, min(100, 100 - \frac{\sigma}{\mu} \times 100))$$

Where:
- $C$ = Confidence percentage (0-100)
- $\sigma$ = Standard deviation of interval gaps
- $\mu$ = Average gap between payments (in days)

**String Similarity:**
$$S = 1 - \frac{d_{Levenshtein}(s_1, s_2)}{max(|s_1|, |s_2|)}$$

**Active Status:**
$$Active = \begin{cases}
TRUE & \text{if } daysSince \leq expectedGap \times 2 \\
FALSE & \text{otherwise}
\end{cases}$$

**Monthly Cost Normalization:**
$$M = \begin{cases}
A \times 4.33 & \text{weekly} \\
A \times 2.17 & \text{bi-weekly} \\
A & \text{monthly} \\
A / 3 & \text{quarterly} \\
A / 12 & \text{yearly}
\end{cases}$$

Where $A$ is the average payment amount.

---

## DATA STRUCTURES

### Invoice Match Result

```typescript
interface MatchResult {
  matched: boolean;
  matchType: 'EXACT' | 'PARTIAL' | 'PROBABLE' | 'NONE';
  invoice?: Invoice;
  invoices?: Invoice[];  // For multi-invoice matches
  confidence: number;    // 0-100
  suggestedAction: 'AUTO_RECONCILE' | 'REVIEW' | 'PARTIAL_PAYMENT' | 'MULTI_INVOICE' | 'CREATE_CUSTOMER';
  matchReasons: string[];
  amountRemaining?: number;
}
```

### Enhanced Transaction Classification

```typescript
interface EnhancedTransactionClassification {
  category: string;
  subcategory?: string;
  confidence: number;  // 0-1

  tax: {
    deductible: boolean;
    deductionPercentage: number;
    deductibleAmount: number;
    vatReclaimable: boolean;
    vatAmount?: number;
    vatRate?: number;
    taxCategory: TaxCategory;
    eurLineNumber?: number;
    eurDescription?: string;
  };

  business: {
    isBusinessExpense: boolean;
    businessPercentage: number;
    requiresDocumentation: boolean;
    documentationType?: 'RECEIPT' | 'INVOICE' | 'CONTRACT' | 'PROOF_OF_PAYMENT';
    specialRequirements?: string[];
  };

  pattern: {
    isRecurring: boolean;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    vendor?: string;
    vendorNormalized?: string;
    vendorCategory?: string;
  };

  flags?: {
    needsReview?: boolean;
    unusualAmount?: boolean;
    newVendor?: boolean;
    requiresSplit?: boolean;
    possiblyPrivate?: boolean;
  };
}
```

### Recurring Pattern

```typescript
interface RecurringPattern {
  vendorName: string;
  normalizedVendorName: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  currency: string;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  nextExpected?: Date;
  confidence: number;  // 0-100
  category?: string;
  taxCategory?: string;
  isActive: boolean;
  status: 'confirmed' | 'predicted' | 'ended';
  intervalStdDev: number;
  amountStdDev: number;
}
```

---

*This document provides the technical specifications required for patent claim drafting.*
