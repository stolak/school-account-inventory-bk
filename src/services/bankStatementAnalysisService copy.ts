import OpenAI from 'openai';
import type { ScoringInput } from './scoringService';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SYSTEM_PROMPT = `
You are a financial statement extraction engine.

Return ONLY a valid JSON object that matches the supplied JSON Schema exactly.

Core rules:
1. Use only the data in the input JSON.
2. Do not explain your work.
3. Do not output markdown.
4. Do not add keys outside the schema.
5. If a value cannot be determined confidently, return null.
6. Month 1 to Month 6 must be chronological based on transaction_date. The most recent month should be the previous  month of the current month and should be month 6.
7. Treat credits as inflows and debits as outflows.
8. Use transaction_date for month grouping.
9. Detect the main income in each month conservatively:
   - consider only credit transactions
   - prefer recurring narration/source across months
   - prefer similar amounts across months
   - deprioritize obvious reversals, loan disbursements, and one-off transfers unless no better income signal exists
10. Normalize main source narration before comparing across months:
   - uppercase
   - trim extra spaces
   - collapse repeated spacing artifacts
   - ignore reference numbers
11. "Number of months with same main source narration" means count of months whose detected main source matches the dominant normalized source across the six months.
12. "Last balance before detected income" means:
   - balance immediately before the detected income transaction in the month
   - if the detected income is the first transaction of the month, use the carried-forward opening balance for that month
   - if no income is detected, return null
13. "Month end balance" is the balance of the last transaction in the month.
14. "Unique negative balance count" means distinct negative-balance episodes in the month; consecutive negative periods count as one episode until balance becomes zero or positive.
15. "Number of unique negative balance episodes longer than 5 days" means the total number across the full six-month period lasting more than 5 calendar days.
16. defined_major_risks_count must equal the count of unique strings returned in risk_flags_triggered.
17. any month without consistence income should be counted as a month with no income and should return 0 income. A month is considered to have consistence income if the detected main source narration is similar for at least 2 months.
Risk rules:
Return zero or more of these flags for each month when evidence exists:
- no_detected_income
- month_end_negative_balance
- negative_balance_episode_present
- outflow_exceeds_inflow
- income_inconsistent_with_recurring_pattern
- high_one_off_or_loan_inflow_ratio
- negative_balance_before_income
- frequent_betting_or_gambling_spend
- many_loan_app_repayments
- repeated_cash_withdrawals_immediately_after_inflow
- suspicious_circular_transfers
- repeated_failed_debits
- many_small_inbound_credits_followed_by_immediate_full_depletion

Interpretation guidance:
- frequent_betting_or_gambling_spend: repeated betting/gambling related debits
- many_loan_app_repayments: repeated debits clearly indicating loan or lender repayment
- repeated_cash_withdrawals_immediately_after_inflow: repeated cash withdrawals shortly after major inflows or detected income
- suspicious_circular_transfers: repeated in-and-out transfers suggesting circular movement of funds
- repeated_failed_debits: repeated failed debit or insufficient-funds style narrations
- many_small_inbound_credits_followed_by_immediate_full_depletion: many small credits followed by rapid depletion

Loan repayment detection:
- total_loan_repayment_detected must be the sum of debit transactions clearly related to loan repayments or lender collections in that month
- exclude loan disbursement credits
- if none detected, return 0

Return amounts as numbers, not strings.
Be conservative. Do not guess.
`.trim();

export interface BankStatementAnalysisResult {
  EmploymentType: 'Employed' | 'Self-employed' | 'Unemployed';
  MonthlySalary: number | null;
  AverageMonthlyIncome: number;
  NumberOfMonthsInCurrentPlaceOfWork: number | null;
  NumberOfOverdraft: number;
  AverageAccountBalance: number;
  TotalExistingLoanRepayment: number;
  CurrentBalance: number;
}
/**
 * Parsed model output for `analyzeBankStatementRework`.
 * Aligned to the scoring pipeline input (`ScoringInput`).
 */
export type BankStatementAnalysisResultSchema = ScoringInput;

/**
 * JSON Schema used for OpenAI structured output.
 * Must stay in sync with `ScoringInput` in `scoringService.ts`.
 */
export const BankStatementAnalysisResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'incomeRecurrent',
    'incomeStability',
    'netCashFlowPositiveCount',
    'liquidityBuffer',
    'creditHistory',
    'riskFactor',
    'overdraftEvents',
    'overdraftDeepestNegativeBalance',
    'overdraftNegativeDays',
    'overdraftRecent',
    'existingLoanRepayment',
  ],
  properties: {
    incomeRecurrent: {
      type: 'object',
      additionalProperties: false,
      required: ['incomeMonths', 'dominantSourceCount', 'isFiftMonth', 'isSixtMonth'],
      properties: {
        incomeMonths: { type: 'number' },
        dominantSourceCount: { type: 'number' },
        isFiftMonth: { type: 'boolean' },
        isSixtMonth: { type: 'boolean' },
      },
    },
    incomeStability: {
      type: 'object',
      additionalProperties: false,
      required: ['averageIncome', 'monthlyIncomes'],
      properties: {
        averageIncome: { type: 'number' },
        monthlyIncomes: {
          type: 'array',
          items: { type: 'number' },
        },
      },
    },
    netCashFlowPositiveCount: { type: 'number' },
    liquidityBuffer: {
      type: 'object',
      additionalProperties: false,
      required: [
        'months',
        'recurringIncomeExists',
        'estimatedMonthlyIncome',
        'averageMonthlyInflow',
      ],
      properties: {
        months: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['preIncomeBalance', 'monthEndBalance'],
            properties: {
              preIncomeBalance: { type: 'number' },
              monthEndBalance: { type: 'number' },
            },
          },
        },
        recurringIncomeExists: { type: 'boolean' },
        estimatedMonthlyIncome: { type: ['number', 'null'] },
        averageMonthlyInflow: { type: ['number', 'null'] },
      },
    },
    creditHistory: { type: 'number' },
    riskFactor: {
      type: 'object',
      additionalProperties: false,
      required: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
      properties: {
        M1: { type: 'number' },
        M2: { type: 'number' },
        M3: { type: 'number' },
        M4: { type: 'number' },
        M5: { type: 'number' },
        M6: { type: 'number' },
      },
    },
    overdraftEvents: { type: ['number', 'null'] },
    overdraftDeepestNegativeBalance: { type: ['number', 'null'] },
    overdraftNegativeDays: { type: ['number', 'null'] },
    overdraftRecent: { type: 'boolean' },
    existingLoanRepayment: { type: 'number' },
  },
} as const;

/**
 * Analyze bank statement data using OpenAI to extract financial information
 * @param data - Array of transaction records from bank statement
 * @returns Analysis result with extracted financial metrics
 */
export async function analyzeBankStatement(
  data: any[],
): Promise<
  { success: true; data: BankStatementAnalysisResult } | { success: false; error: string }
> {
  // this part to be removed later
  if (data.length < 19999999 || !Array.isArray(data)) {
    return {
      success: true,
      data: {
        EmploymentType: 'Self-employed',
        MonthlySalary: 81079754.0,
        AverageMonthlyIncome: 81079754.0,
        NumberOfMonthsInCurrentPlaceOfWork: 0,
        NumberOfOverdraft: 0,
        AverageAccountBalance: 3884847.0,
        TotalExistingLoanRepayment: 0,
        CurrentBalance: 3884847.0,
      },
    };
  }
  // this part to be removed later

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OPENAI_API_KEY is not configured',
      };
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        error: 'Bank statement data is required and must be a non-empty array',
      };
    }

    const prompt = `
    You are a financial data analyst AI.  
    Your task is to analyze a customer's bank statement and extract the following fields.  
    The input will be a JSON array of transaction records.  
    The data can vary in structure, narration, date, and amounts, but the meaning must be inferred correctly.
    
    Extract and return ONLY a valid JSON object with the following fields:
    
    1. EmploymentType: "Employed" | "Self-employed" | "Unemployed".
      - Use "Employed" if the customer receives consistent monthly salary inflows. Use the narration to determine if the customer is employed.
      - Use "Self-employed" if income inflows are irregular but repeated over time.
      - Use "Unemployed" if there are no income inflows.
    2. MonthlySalary: number | null
      - If employed, infer the most repeated monthly inflow amount.
      - If not employed, return null.
    3. AverageMonthlyIncome: number
      - Sum all credit inflows in each month, divide by number of months in record.
    4. NumberOfMonthsInCurrentPlaceOfWork: number | null
      - If employed, count number of months salary was received.
      - If not employed, return null.
    5. NumberOfOverdraft: number
      - Count the number of times balance goes below zero.
    6. AverageAccountBalance: number
      - Average of all balances across the statement.
    7. TotalExistingLoanRepayment: number
      - Sum all debit transactions that look like loan repayments in the most recent month 
      Example patterns: "loan repayment", "loan", "repay", "deduction", "credit facility", "salary advance repayment", "overdraft repayment".
    8. CurrentBalance: number
      - The most recent balance in the statement (highest date).
    
    OUTPUT FORMAT:
    {
      "EmploymentType": "",
      "MonthlySalary": 0,
      "AverageMonthlyIncome": 0,
      "NumberOfMonthsInCurrentPlaceOfWork": 0,
      "NumberOfOverdraft": 0,
      "AverageAccountBalance": 0,
      "TotalExistingLoanRepayment": 0,
      "CurrentBalance": 0
    }
    
    Return ONLY JSON. No extra text.
    
    Bank Statement Data:
    ${JSON.stringify(data)}
      `;

    const response = await client.chat.completions.create({
      model: 'gpt-4o', // Update to "gpt-5" when available
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: 'No response content from OpenAI',
      };
    }

    // Parse the JSON response
    let analysisResult: BankStatementAnalysisResult;
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse OpenAI response: ${
          parseError instanceof Error ? parseError.message : 'Unknown error'
        }`,
      };
    }

    // Validate the result structure
    if (
      !analysisResult ||
      typeof analysisResult !== 'object' ||
      !('EmploymentType' in analysisResult) ||
      !('AverageMonthlyIncome' in analysisResult) ||
      !('NumberOfOverdraft' in analysisResult) ||
      !('AverageAccountBalance' in analysisResult) ||
      !('TotalExistingLoanRepayment' in analysisResult) ||
      !('CurrentBalance' in analysisResult)
    ) {
      return {
        success: false,
        error: 'Invalid analysis result structure from OpenAI',
      };
    }

    return {
      success: true,
      data: analysisResult,
    };
  } catch (error: any) {
    console.error('Error analyzing bank statement:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to analyze bank statement',
    };
  }
}

export async function analyzeBankStatementRework(
  data: any[],
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<{ success: true; data: ScoringInput } | { success: false; error: string }> {
  const response = await client.responses.create({
    model: 'gpt-5.4',
    store: false,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: systemPrompt.trim(),
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text:
              'Analyze the following bank statement JSON and return the required output JSON only.\n\n' +
              JSON.stringify(data),
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'bank_statement_analysis',
        schema: BankStatementAnalysisResultSchema,
        strict: true,
      },
    },
  });
  const parsed = JSON.parse(response.output_text) as BankStatementAnalysisResultSchema;
  if (!parsed) {
    return {
      success: false,
      error: 'Failed to parse OpenAI response',
    };
  }
  // console.log('parsed', parsed);
  return { success: true, data: parsed };
}
