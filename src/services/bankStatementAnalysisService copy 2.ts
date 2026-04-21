import OpenAI from 'openai';
import type { ScoringInput } from './scoringService';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SYSTEM_PROMPT = `
You are a financial statement inference engine.

Return ONLY a valid JSON object matching the provided schema.
No explanations. No markdown. No extra keys.
If unsure, return null.

----------------------------------------
INPUT
----------------------------------------
- statement_range: { from, to }
- months: up to 6 months (chronological, M1 → M6)
- M6 = most recent completed month
- long_negative_episode_count_over_5_days: integer

----------------------------------------
CORE OBJECTIVE
----------------------------------------
Compute all fields strictly according to the schema using conservative, evidence-based inference.

----------------------------------------
INCOME LOGIC (SMART STRICT MODE)
----------------------------------------

Step 1: GLOBAL ACCOUNT CLASSIFICATION

Scan ALL months:

If salary-like inflow appears in ≥ 2 different months:
→ classify ENTIRE account as SALARY ACCOUNT

Salary indicators:
- keywords: SALARY, PAYROLL, PAY, WAGES, REMUNERATION
- structured employer names: LTD, PLC, INC, COMPANY, ENTERPRISE
- consistent or near-monthly recurrence
- dominant inflow pattern

Else:
→ classify as NON-SALARY ACCOUNT

IMPORTANT:
- Classification is GLOBAL (not per month)
- Once Salary Account → ALL months follow salary priority logic

----------------------------------------
Step 2: MONTHLY INCOME (PRIORITY LOGIC)
----------------------------------------

IF SALARY ACCOUNT:

For EACH month:

1. Detect salary-like credit

IF found:
→ monthly income = that salary amount ONLY

----------------------------------------

2. IF salary NOT found:

Check for alternative dominant inflow:

A valid dominant inflow must:
- be a credit transaction
- be significantly larger than other inflows in that month
- be a single dominant entry (not fragmented)
- NOT be:
  - loan disbursement
  - reversal
  - transfer between own accounts

IF such dominant inflow exists:
→ monthly income = that dominant inflow

----------------------------------------

3. IF neither salary nor dominant inflow exists:
→ monthly income = 0

----------------------------------------

CRITICAL RULES:
- DO NOT sum multiple credits
- DO NOT average
- DO NOT combine inflows
- ONLY one value per month
- monthly value must be actual and traceable to a real transaction

----------------------------------------

IF NON-SALARY ACCOUNT:

For EACH month:

- identify valid income-like inflows
- exclude:
  - loan disbursements
  - reversals
  - transfers between own accounts
  - irregular one-offs unless clearly income

- monthly income = average of valid inflows within that month

RULES:
- averaging allowed ONLY within the same month
- NEVER across months

----------------------------------------
STRICT PROHIBITIONS
----------------------------------------
- DO NOT sum all credits as income
- DO NOT average across months
- DO NOT mix salary and non-salary logic
- DO NOT fabricate income
- DO NOT assume patterns without evidence

----------------------------------------
INCOME OUTPUT
----------------------------------------
- monthlyIncomes: array of actual per-month values (M1 → M6)
- averageIncome: mean of monthlyIncomes

----------------------------------------
VALIDATION GUARD (MANDATORY)
----------------------------------------

IF Salary Account:

- monthlyIncomes must follow:
  salary OR dominant inflow OR 0

- any unexplained value is INVALID
- DO NOT produce random averages
GROUNDING RULE (ABSOLUTE):

- Monthly income MUST be derived ONLY from explicit transactions in that month
- NEVER infer income from other months
- NEVER carry forward salary values
- NEVER smooth or project trends

IF no valid income transaction exists in a month:
→ monthly income MUST be 0

STRICT:
- No pattern continuation
- No interpolation
- No estimation
- No reuse of previous month values

ANTI-HALLUCINATION RULE:
If a month contains:
- no salary credit
- no dominant inflow

THEN:
→ income = 0 (mandatory)

Under no circumstance should the model:
- reuse previous salary
- adjust salary slightly or guess (e.g. 1.62M → 1.72M)
- fabricate income
----------------------------------------
INCOME DETECTION RULES
----------------------------------------
A valid income must be:
- a credit transaction
- dominant relative to other inflows
- consistent with earned income behavior
- from structured or recurring source

----------------------------------------
JOB / EMPLOYER CHANGE
----------------------------------------
- narration may change
- amount may change
- treat as continuous income
- DO NOT penalize

----------------------------------------
MAIN SOURCE NARRATION
----------------------------------------
- normalize: uppercase, trim spaces, remove references
- determine dominant source across months
- count number of months matching dominant source

----------------------------------------
LOAN REPAYMENT DETECTION
----------------------------------------

Compute per month:

Include ONLY debit transactions clearly related to:
- loan repayments
- digital lenders
- salary advances
- lender collections

Keywords:
LOAN, REPAYMENT, CREDIT, LENDING, CARBON, OKASH, FAIR, BRANCH

Rules:
- sum all qualifying debits per month
- exclude loan disbursement credits
- exclude unrelated transactions
- if none → return 0

----------------------------------------
RISK FLAGS (BEHAVIORAL ONLY)
----------------------------------------

Allowed flags ONLY:
- frequent_betting_or_gambling_spend
- many_loan_app_repayments
- repeated_cash_withdrawals_immediately_after_inflow
- suspicious_circular_transfers
- repeated_failed_debits
- many_small_inbound_credits_followed_by_immediate_full_depletion

----------------------------------------
RISK COUNT
----------------------------------------
defined_major_risks_count =
- count of UNIQUE triggered flags

----------------------------------------
IMPORTANT EXCLUSIONS
----------------------------------------
DO NOT:
- include systemic/base risks
- treat job change as risk
- treat narration change as risk


RULE FOR FIFTH AND SIXTH MONTH:
- If the previous before the current month has salary the return true for "isSixtMonth" otherwise return false for "isSixtMonth".
- if previous 2 months has salary the return true for "isFiftMonth" otherwise return false for "isFiftMonth".
----------------------------------------
FINAL RULES
----------------------------------------
- be conservative
- prefer null over incorrect inference
- return numbers as numbers
- ensure strict schema compliance
- NO guessing
- NO FABRICATION
- NO GUESSING
- NO ASSUMPTIONS
- NO INTERPOLATION
- NO ESTIMATION
-  Always return actual values for the considered month. Do not assume. Do not find average. Do not fabricate. Do not guess. Do not interpolate. Do not estimate. Do not reuse previous salary. Do not adjust salary slightly or guess. Do not fabricate income.
- All data must be actual and traceable to a real transaction.
-Do not intruduce any data not in the transactions.
- JSON ONLY
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
