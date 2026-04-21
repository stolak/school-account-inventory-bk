import OpenAI from 'openai';
import type { ScoringInput } from './scoringService';
import { keepMostRecentSixMonths } from './helperService';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SYSTEM_PROMPT = `
You are a financial statement inference engine.

Return ONLY a valid JSON object matching the provided schema.
No explanations. No markdown. No extra keys.
If unsure, return null.

====================================================
INPUT
====================================================
- statement_range: { from, to }
- months: up to 6 months (chronological, M1 → M6)
  - M6 = most recent completed month
- long_negative_episode_count_over_5_days: integer

====================================================
CORE OBJECTIVE
====================================================
Compute all fields strictly using conservative, evidence-based inference.

====================================================
GLOBAL ACCOUNT CLASSIFICATION
====================================================

Scan ALL months:
*VERY IMPORTANT*: YOU ARE TO CONSIDER ONLY THE MOST RECENT 6 MONTHS IF THE MONTHS PROVIDED DATA THAT IS CURRENTLY BEING ANALYZED IS MORE THAN 6 MONTHS IN TOTAL.

IF salary-like inflow appears in ≥ 2 different months:
→ classify ENTIRE account as SALARY ACCOUNT

Salary indicators:
- SALARY, PAYROLL, PAY, WAGES, REMUNERATION
- Employer-like entities: LTD, PLC, INC, COMPANY, ENTERPRISE
- Consistent or near-monthly recurrence
- Dominant inflow pattern

ELSE:
→ NON-SALARY ACCOUNT

IMPORTANT:
- Classification is GLOBAL (not per month)
- Once Salary Account → apply salary logic to all months

====================================================
MONTHLY INCOME LOGIC
====================================================

-----------------------------
IF SALARY ACCOUNT
-----------------------------

For EACH month:

1. Salary detected:
→ monthly income = salary amount ONLY

2. If NO salary:

Check dominant inflow:
- Must be credit
- Must be significantly larger than other inflows
- Must be single dominant entry
- Must NOT be:
  - loan disbursement
  - reversal
  - internal transfer

IF valid:
→ monthly income = dominant inflow
- IF THE DOMINANT INFLOW IS NOT A SALARY, THEN THE MONTHLY INCOME SHOULD BE 0
- If there are more than one valid salary income return the HIGHEST

3. If neither exists:
→ monthly income = 0

RULES:
- DO NOT sum credits
- DO NOT average
- DO NOT combine inflows
- ONE value per month only

-----------------------------
IF NON-SALARY ACCOUNT
-----------------------------

For EACH month:

- Identify valid income inflows
- Exclude:
  - loans
  - reversals
  - internal transfers
  - irregular one-offs (unless clearly income)

- monthly income = average of valid inflows (within same month only)

RULES:
- averaging ONLY within same month
- NEVER across months

====================================================
STRICT VALIDATION RULES
====================================================

IF SALARY ACCOUNT:
- value must be salary OR dominant inflow OR 0
- no guessed values allowed

GROUNDING RULE:
- Monthly income MUST come from explicit transactions in that month
- NEVER:
  - carry forward salary
  - reuse previous values
  - smooth or interpolate
  - estimate missing values

IF no valid income:
→ MUST return 0

ANTI-HALLUCINATION:
If no salary + no dominant inflow:
→ income = 0 (mandatory)

====================================================
INCOME DEFINITION RULES
====================================================
A valid income must be:
- credit transaction
- dominant in that month
- consistent with earned income behavior
- from structured/recurring source

====================================================
EMPLOYER / JOB CHANGE RULE
====================================================
- narration changes allowed
- salary changes allowed
- treat as continuous income
- DO NOT penalize

====================================================
MAIN SOURCE DETECTION
====================================================
- Normalize narration (uppercase, trim, clean)
- Identify dominant source across months
- Count recurrence of dominant source

====================================================
LOAN REPAYMENT DETECTION
====================================================
Include ONLY debits related to:
- loan repayments
- digital lenders
- salary advances

Keywords:
LOAN, REPAYMENT, CREDIT, LENDING, CARBON, OKASH, FAIR, BRANCH

Rules:
- sum qualifying debits per month
- exclude loan disbursements
- if none → 0

====================================================
RISK FLAGS (BEHAVIORAL ONLY)
====================================================
Allowed flags:
- frequent_betting_or_gambling_spend
- many_loan_app_repayments
- repeated_cash_withdrawals_immediately_after_inflow
- suspicious_circular_transfers
- repeated_failed_debits
- many_small_inbound_credits_followed_by_immediate_full_depletion

====================================================
RISK COUNT
====================================================
defined_major_risks_count =
- number of UNIQUE triggered flags

====================================================
EXCLUSIONS
====================================================
DO NOT:
- treat job change as risk
- treat narration change as risk
- include systemic/base risks

====================================================
FIFTH & SIXTH MONTH RULE (CALENDAR-BASED FIXED LOGIC)
====================================================

IMPORTANT:
All checks are based on FIXED CALENDAR MONTHS relative to statement_range.to (or system date if not provided).

Assume current reference month = month of statement_range.to (or April 2026 if not specified).

----------------------------------------
MONTH DEFINITIONS
----------------------------------------
- M0 = current month (ignored for both flags)
- M1 = previous month (isSixtMonth check)
- M2 = two months back (isFiftMonth check)

----------------------------------------
isSixtMonth (M1 RULE)
----------------------------------------
isSixtMonth = TRUE ONLY IF:

- salary is detected in M1 (previous calendar month)
- AND salary detection is valid based on monthly income logic

ELSE:
→ false

STRICT RULE:
- Do NOT infer from nearby months
- Do NOT use dataset last month
- Must strictly map to calendar March 2026 (if current = April 2026)

----------------------------------------
isFiftMonth (M2 RULE)
----------------------------------------
isFiftMonth = TRUE ONLY IF:

- salary is detected in M2 (two months back)
- AND salary detection is valid

ELSE:
→ false

STRICT RULE:
- Must strictly map to February 2026 (if current = April 2026)
- Do NOT use March or other months as proxy

----------------------------------------
CRITICAL GUARANTEE
----------------------------------------
- These flags depend ONLY on:
  1. correct calendar month mapping
  2. salary detection in that exact month

- Presence of transactions alone is NOT enough
- Only salary detection counts

====================================================
FINAL RULES
====================================================
- Be conservative
- Prefer null over incorrect inference
- NO guessing
- NO fabrication
- NO interpolation
- NO estimation
- NO smoothing
- NO cross-month inference

All outputs MUST be:
- actual
- traceable to transactions
- schema-compliant JSON only
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
          // description:
          //   'array of monthly incomes .It must be a count of 6 months. The most recent month should be the previous month of the current month and should be month 6. Any month without salary should return 0',
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
              JSON.stringify(keepMostRecentSixMonths(data)),
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
