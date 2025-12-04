import {
  TinkAccount,
  TinkAccountType,
  TinkTransaction,
  TinkTransactionStatus,
  TinkTransactionType,
  TinkProvider,
  TinkToken,
} from '../tink.types';

/**
 * Mock Data Utility for Tink Development/Testing
 * Provides realistic test data for development without real bank connections
 */
export class TinkMockDataUtil {
  /**
   * Generate mock OAuth2 token
   */
  static generateMockToken(): TinkToken {
    return {
      accessToken: 'mock_access_token_' + Math.random().toString(36).substring(7),
      refreshToken: 'mock_refresh_token_' + Math.random().toString(36).substring(7),
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: 'accounts:read,balances:read,transactions:read',
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  /**
   * Generate mock bank accounts
   */
  static generateMockAccounts(): TinkAccount[] {
    return [
      {
        id: 'mock_account_checking_1',
        identifiers: {
          iban: 'DE89370400440532013000',
          accountNumber: '532013000',
        },
        name: 'Main Checking Account',
        type: TinkAccountType.CHECKING,
        balances: {
          booked: {
            amount: {
              value: 15234.56,
              currencyCode: 'EUR',
            },
          },
          available: {
            amount: {
              value: 15234.56,
              currencyCode: 'EUR',
            },
          },
        },
        dates: {
          lastRefreshed: new Date(),
        },
      },
      {
        id: 'mock_account_savings_1',
        identifiers: {
          iban: 'DE89370400440532013001',
          accountNumber: '532013001',
        },
        name: 'Savings Account',
        type: TinkAccountType.SAVINGS,
        balances: {
          booked: {
            amount: {
              value: 45678.90,
              currencyCode: 'EUR',
            },
          },
          available: {
            amount: {
              value: 45678.90,
              currencyCode: 'EUR',
            },
          },
        },
        dates: {
          lastRefreshed: new Date(),
        },
      },
      {
        id: 'mock_account_credit_1',
        identifiers: {
          accountNumber: '5321-****-****-1234',
        },
        name: 'Business Credit Card',
        type: TinkAccountType.CREDIT_CARD,
        balances: {
          booked: {
            amount: {
              value: -2345.67,
              currencyCode: 'EUR',
            },
          },
          available: {
            amount: {
              value: 7654.33,
              currencyCode: 'EUR',
            },
          },
        },
        dates: {
          lastRefreshed: new Date(),
        },
      },
    ];
  }

  /**
   * Generate mock transactions for an account
   */
  static generateMockTransactions(accountId: string, count: number = 50): TinkTransaction[] {
    const transactions: TinkTransaction[] = [];
    const now = new Date();

    const merchantNames = [
      'Amazon',
      'Office Depot',
      'Starbucks',
      'Shell Gas Station',
      'LinkedIn',
      'Adobe',
      'AWS Services',
      'Microsoft',
      'Google Ads',
      'Salary Payment',
      'Client Payment - ABC Corp',
      'Rent Payment',
      'Electricity Bill',
      'Insurance Premium',
      'Bank Fee',
    ];

    const transactionTypes = [
      TinkTransactionType.PAYMENT,
      TinkTransactionType.TRANSFER,
      TinkTransactionType.WITHDRAWAL,
      TinkTransactionType.DEPOSIT,
      TinkTransactionType.FEE,
    ];

    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const isDeposit = Math.random() > 0.6;
      const amount = isDeposit
        ? Math.random() * 5000 + 100
        : -(Math.random() * 500 + 10);

      const merchantName = merchantNames[Math.floor(Math.random() * merchantNames.length)];
      const txnType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];

      transactions.push({
        id: `mock_txn_${accountId}_${i}`,
        accountId,
        amount: {
          value: parseFloat(amount.toFixed(2)),
          currencyCode: 'EUR',
        },
        dates: {
          booked: date,
          value: date,
        },
        descriptions: {
          original: merchantName,
          display: merchantName,
        },
        identifiers: {
          providerTransactionId: `MOCK-${Date.now()}-${i}`,
        },
        merchantInformation: {
          merchantName: merchantName,
          merchantCategoryCode: '5411',
        },
        status: Math.random() > 0.9 ? TinkTransactionStatus.PENDING : TinkTransactionStatus.BOOKED,
        types: {
          type: txnType,
          financialInstitutionType: 'SEPA',
        },
        providerMutability: 'MUTABILITY_IMMUTABLE',
      });
    }

    // Sort by date descending
    return transactions.sort((a, b) => b.dates.booked.getTime() - a.dates.booked.getTime());
  }

  /**
   * Generate mock providers (banks)
   */
  static generateMockProviders(): TinkProvider[] {
    return [
      {
        name: 'mock-bank-de',
        displayName: 'Mock Deutsche Bank',
        type: 'BANK',
        status: 'ENABLED',
        credentialsType: 'THIRD_PARTY_AUTHENTICATION',
        isPopular: true,
        fields: [
          {
            name: 'username',
            description: 'Username',
            optional: false,
            numeric: false,
            immutable: false,
            sensitive: false,
          },
          {
            name: 'password',
            description: 'Password',
            optional: false,
            numeric: false,
            immutable: false,
            sensitive: true,
          },
        ],
        groupDisplayName: 'German Banks',
        capabilities: ['ACCOUNTS', 'TRANSACTIONS', 'BALANCE'],
        accessType: 'OPEN_BANKING',
        market: 'DE',
        financialInstitution: {
          id: 'mock-fi-001',
          name: 'Mock Deutsche Bank',
        },
      },
      {
        name: 'mock-bank-at',
        displayName: 'Mock Erste Bank Austria',
        type: 'BANK',
        status: 'ENABLED',
        credentialsType: 'THIRD_PARTY_AUTHENTICATION',
        isPopular: true,
        fields: [
          {
            name: 'username',
            description: 'Username',
            optional: false,
            numeric: false,
            immutable: false,
            sensitive: false,
          },
          {
            name: 'password',
            description: 'Password',
            optional: false,
            numeric: false,
            immutable: false,
            sensitive: true,
          },
        ],
        groupDisplayName: 'Austrian Banks',
        capabilities: ['ACCOUNTS', 'TRANSACTIONS', 'BALANCE'],
        accessType: 'OPEN_BANKING',
        market: 'AT',
        financialInstitution: {
          id: 'mock-fi-002',
          name: 'Mock Erste Bank Austria',
        },
      },
    ];
  }

  /**
   * Generate mock authorization URL
   */
  static generateMockAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    return `https://link.tink.com/1.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&market=DE&locale=en_US&test=true`;
  }
}
