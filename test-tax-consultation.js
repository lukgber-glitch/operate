/**
 * Test Tax Consultation Handler
 * Tests the tax consultation action via chatbot
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';
const TEST_USER_EMAIL = 'test@operate.guru';

// Test scenarios
const testScenarios = [
  {
    name: 'Deductibility Question',
    message: 'Can I deduct this laptop purchase for 1500 EUR?',
    expectedType: 'deductibility',
  },
  {
    name: 'Tax Liability Estimate',
    message: 'What is my estimated tax liability for Q4 2024?',
    expectedType: 'liability',
  },
  {
    name: 'VAT Deadline',
    message: 'When is my VAT due?',
    expectedType: 'deadline',
  },
  {
    name: 'VAT Rate Question',
    message: 'What is the VAT rate for software services in Germany?',
    expectedType: 'vat_rate',
  },
  {
    name: 'Category Question',
    message: 'How should I categorize my Zoom subscription expense?',
    expectedType: 'category',
  },
  {
    name: 'General Tax Question',
    message: 'What tax benefits are available for startups in Germany?',
    expectedType: 'general',
  },
];

async function testTaxConsultation() {
  console.log('🧪 Testing Tax Consultation Handler\n');
  console.log('=' .repeat(60));

  for (const scenario of testScenarios) {
    console.log(`\n📋 Test: ${scenario.name}`);
    console.log(`💬 Message: "${scenario.message}"`);
    console.log('-'.repeat(60));

    try {
      // Send message to chatbot
      const response = await axios.post(
        `${API_URL}/chatbot/chat`,
        {
          message: scenario.message,
          conversationId: 'test-tax-consultation',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            // Add auth token here if needed
          },
        }
      );

      if (response.data.success) {
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(response.data.data, null, 2));

        // Check if action was executed
        if (response.data.action) {
          console.log('\n🎯 Action Detected:');
          console.log('Type:', response.data.action.type);
          console.log('Consultation Type:', response.data.action.result?.consultationType);
          console.log('Country:', response.data.action.result?.country);
        }
      } else {
        console.log('❌ Failed:', response.data.error);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    console.log('');
  }

  console.log('=' .repeat(60));
  console.log('\n✨ Tax consultation testing complete!\n');
}

// Run tests
testTaxConsultation().catch(console.error);
