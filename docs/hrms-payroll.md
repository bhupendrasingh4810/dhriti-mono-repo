# HRMS payroll

## User guide: a complete worked example

Payroll is a configurable foundation, not a complete country-compliance or banking
product. It calculates rules you configure; selecting a country does not load its
tax laws. The examples below are fictional training data, **not statutory rates
or recommendations**.

## Expansion delivery status

The global feature expansion is being delivered in stages, not claimed complete.
All countries remain in scope for configuration; no country is certified compliant.
No bank, accounting, or EOR provider has been selected.

| Stage | Scope | Status |
| --- | --- | --- |
| 1 | Calendar-day joining/leaving, salary revisions, date-allocated unpaid leave, draft cancellation/rejection and replacement | Implemented; details below |
| 2 | Organization Settings bank accounts; selected country-specific account-format checks; evidence-based independent manual review; explicit unconnected provider-verification contracts | Implemented; no bank-confirmed ownership or live payments |
| 3 | One-time/recurring variable inputs, hourly/overtime pay, configurable pay calendars/frequencies, variance and exception review | Implemented for monthly, weekly, every-two-weeks and twice-monthly calendars, approved fixed/hour inputs and prior-payroll deltas; configurable anomaly thresholds remain pending |
| 4 | Arrears, off-cycle runs, final settlements, controlled approved/processed adjustments and reversals | Pending |
| 5 | YTD opening balances/imports, PDF payslips, employee self-service, declarations and tax documents | Pending |
| 6 | Accounting mappings/journals, reports, bulk imports, operational history, configurable approvals and reminders | Pending |
| 7 | Benefits, loans/advances/recoveries, reimbursement receipt uploads, policies and rejection/resubmission | Pending |
| 8 | Versioned country/subnational compliance packs, filings/year-end output, provider/EOR coordination and explicit-FX consolidation | Pending; requires authoritative rules and qualified local validation |
| 9 | Provider-backed payment verification, individual transfer results, idempotent retries and reconciliation | Pending; real transfers/filings cannot run while providers are unconnected |

Preserve the existing tabs and features throughout. Completed stages do not imply
later-stage functionality exists. Bank secrets must not be stored in plaintext or
returned in full by list APIs. Format validity, manual document review, provider
ownership verification, and settlement are separate states; never simulate verified
ownership or a successful live transfer.

### Payroll calendars: monthly, weekly, every two weeks and twice monthly

This phase adds configurable calendars without removing any existing payroll tabs,
tables or workflow steps. Existing profiles remain MONTHLY, with no anchor and a
zero-day pay-date offset. Existing approved/processed snapshots are not migrated
or recalculated; saved monthly drafts retain their saved proration policy.

**Setup**

1. Open **Payroll -> Configuration -> Add payroll profile**.
2. Select **Pay frequency**: Monthly, Weekly, Every two weeks, or Twice monthly.
3. For Weekly/Every two weeks, enter **Calendar anchor (cycle start)**. It is a
   cycle-alignment reference, not a payment date. Weekly periods contain seven
   inclusive calendar dates; every-two-weeks periods contain fourteen.
4. Twice-monthly periods are **1–15** and **16–month-end**, not fourteen-day cycles.
5. Set **Pay-date offset (calendar days)** from 0 to 60. The suggested pay date is
   period-end plus this offset. Weekends and holidays do **not** shift it.
6. Non-monthly **Effective from** must itself be a configured cycle start. This
   avoids an initial gap before the first selectable period. The anchor may be
   earlier or later: alignment and the profile effective date together determine
   eligible periods.
7. Save, add a salary structure and assign employees as before. Salary amounts and
   all recurring fixed/percentage components remain **monthly contractual rates**.
8. Under **Configuration -> Payroll calendar**, select the pay group and year.
   The API-backed table lists start, inclusive end and scheduled pay dates,
   with the existing search, sorting, filters, internal scrolling and pagination.

Calendar settings are immutable after profile creation. Create a new profile and
effective-dated salary assignment for a change; do not mutate a historical
calendar. A transfer inside a period is blocked until a supported boundary/
settlement is used. Closed draft replacement remains available.

**Running a non-monthly payroll**

Open **Start payroll run**, choose the profile, then choose a calendar period.
The year picker supports cross-year cycles; a period intersecting January may
start in December. Only periods starting on/after the profile's effective date
are offered. Selecting a period fills its scheduled pay date. You may explicitly
change the pay date, but not to a date before period-end. For monthly payroll,
the existing month input stays in place; **Use scheduled pay date** fills the
configured suggestion on request.

Non-monthly runs require **Calendar days**; the legacy full-month policy is not
available for them. All six review/approval/processing steps remain. The API
checks the canonical start key against the profile's anchor/boundaries rather
than trusting browser-supplied dates. Payroll approval stores real inclusive
start/end dates in canonical employee records, not an invented monthly date range.
Disjoint periods in the same month are allowed; an overlap with any existing
employee payroll, including a legacy free-text period, blocks approval. The
checks run within the existing serializable approval transaction.

**How salary allocation works**

Each recurring component is allocated using the number of calendar days in its
own month. A period crossing months combines each month's allocation. Joining,
leaving, effective-dated revisions and approved full/half-day unpaid leave apply
to the actual dates, just as in monthly calendar proration. Weekends/holidays
count as calendar days. There is no `monthly × 12 ÷ 52/26` conversion.

Currency rounding uses deterministic cumulative month-to-date differences:

`allocated component for day d = round(monthly component × d ÷ month days) − round(monthly component × (d−1) ÷ month days)`.

This assigns any minor-unit remainder to specific dates, ensuring a complete
unchanged month split into disjoint periods sums to the configured monthly
component. Unpaid fractions reduce that day's allocation; the period component
total is then currency-rounded. Revisions/partial employment use only their
applicable dates, so their totals naturally differ from a full unchanged month.
The older monthly calculation/rounding policy is preserved for compatibility.
Contractual monthly/annual CTC is not multiplied by the number of pay periods.

**Fictional example with one monthly earning component**

Asha has one INR 30,000 monthly BASIC earning, no deductions, no leave and no
salary revision. These are alternatives, not overlapping runs for one employee:

| Calendar | Period | Gross |
| --- | --- | --- |
| Weekly, anchor 2026-11-02 | 2026-11-02 through 2026-11-08 | INR 7,000.00 |
| Every two weeks, same anchor | 2026-11-02 through 2026-11-15 | INR 14,000.00 |
| Every two weeks, same anchor | 2026-11-30 through 2026-12-13 | INR 13,580.65 |
| Twice monthly | 2026-12-01 through 2026-12-15 | INR 14,516.13 |
| Twice monthly | 2026-12-16 through 2026-12-31 | INR 15,483.87 |

With an offset of 2, the first weekly period suggests **2026-11-10** as pay date.
The two December twice-monthly amounts total INR 30,000 exactly, but are not equal
halves because December has 31 calendar days. Multiple component lines round
independently, so their period split can differ by minor units from this
single-component example while preserving each complete monthly component total.

**Variable inputs and reporting**

- Monthly inputs retain their existing inclusive month-range behavior.
- On other frequencies, choose **one exact target period** in the input form.
  Fixed input amounts and explicit hours/rate/multiplier amounts apply once,
  in full, to that period. They do not automatically recur every week or prorate
  as monthly allowances. Add a contractual recurring monthly allowance to the
  salary structure, or enter separately approved exact-period inputs.
- Cross-month hours are supported when their target period crosses months; the
  input's internal month bounds are derived from that period, not guessed.
- Pending applicable inputs still block approval. Independent approval, employee
  self-approval prevention, locked-period checks and immutable approved input
  history are unchanged.
- Review/payslips/register exports retain actual date ranges, frequency, salary
  allocation, monthly day denominators and scheduled/selected pay dates where
  applicable. Old snapshots without new metadata show blank new export fields.
- Variance still compares the latest earlier same-currency canonical payroll.
  Different frequencies and period lengths can produce legitimate large changes;
  no automatic anomaly threshold or currency conversion is implied.

API: `GET /organization/hrms/payroll/profiles/:id/periods?year=2026` returns an
authorized tenant calendar. Profile creation accepts `frequency`,
`calendarAnchor` (required for weekly/every-two-weeks) and `payDateOffset`.
Run `period` remains `YYYY-MM` for MONTHLY; other frequencies use the canonical
`YYYY-MM-DD` start date. Variable inputs on non-monthly profiles require
`targetPeriod`, with `startPeriod`/`endPeriod` matching the target's month bounds.
New snapshots include `periodStart`, `periodEnd`, `scheduledPayDate` and
`salaryAllocation`; new proration segments include their month/day denominators.

Migration `20261114170000_payroll_calendars` was deployed with approval to the
configured development database. It adds calendar columns/constraints and the
optional variable-input target; it resets no data. Other environments must
deploy it before this version runs. No holiday calendar, business-day shifting,
automatic statutory rules, auto-run scheduler or live provider execution is
implied. Later roadmap stages and configurable anomaly thresholds remain pending.

### Variable pay: bonuses, commissions, recoveries and approved hours

Open **Payroll -> Employee salary -> Add variable pay input**. Existing salary
assignments remain unchanged. You need `hrms.payroll.manage` to add/cancel a pending
input, and `hrms.payroll.approve` to approve/reject one. A different user must
approve/reject; employees cannot approve their own compensation.

Choose the employee, payroll profile, input name, earning/deduction/employer
contribution, calculation basis, inclusive start/end months and a reason/source
reference. FIXED requires quantity and multiplier of 1. HOURS requires explicit
hours, rate and multiplier and applies to exactly one month. Calculated amounts
are rounded HALF_UP to the profile's currency precision.

**Fictional Acme example:** Asha already has INR 10,000 monthly gross, INR 100.25
configured recurring deductions and INR 600 recurring employer contributions.
For January, Finance adds these four independently approved inputs:

| Input | Type and basis | January amount |
| --- | --- | --- |
| Performance award | Earning, fixed INR 1,000 | INR 1,000.00 |
| Approved overtime, timesheet TS-100 | Earning, 10.5 hours x INR 125.25 x 1.5 | INR 1,972.69 |
| Agreed recovery, reference REC-100 | Deduction, fixed INR 200 | INR 200.00 |
| Additional employer contribution | Employer, fixed INR 50 | INR 50.00 |

With no reimbursements, January gross is INR 12,972.69, deductions INR 300.25,
net INR 12,672.44 and period employer cost INR 13,622.69. Contractual monthly CTC
stays INR 10,600 and annual CTC INR 127,200; a one-time award must not inflate
the employee's contractual annual salary.

For a recurring allowance, enter a fixed INR 300 with February through April.
It applies **in full once per month**, not once for the whole range, and stops
after April. Use finite ranges deliberately: approved inputs cannot currently be
edited, cancelled or shortened. Pending inputs can be cancelled by a manager or
rejected by an independent approver. Approved corrections/reversals remain stage 4.

Important boundaries:

- These are supplements to an existing **monthly-rate salary assignment** (which
  can now be paid on any configured frequency), not an
  hourly-only contract or a timesheet approval system.
- No country overtime premium, tax rule, statutory cap or automatic withholding
  is inferred. The entered 1.5 multiplier is illustrative, not legal guidance.
  Add separately verified additional tax as a deduction if required.
- Inputs are applied after recurring salary/proration calculations; recurring
  percentage deductions are not automatically recalculated on a bonus and variable
  inputs are not prorated for joining/leaving or unpaid days.
- Deductions cannot exceed earned gross; reimbursements cannot fund a negative
  salary. Employer contributions affect employer cost, not employee net.
- Assign the employee to the selected pay group for the entire input range first.
  Creation and approval validate that range against known salary revisions.
  A later conflicting transfer blocks payroll rather than silently discarding
  the old group's applicable input.
- Existing canonical payroll in the range blocks input creation/approval.
  Applicable pending inputs block payroll approval. Rejected/cancelled inputs
  never contribute money.
- Payroll approval recalculates current approved inputs, then stores their IDs,
  decimal basis, amounts and reasons in the immutable snapshot. Processing,
  payslips and reports use that snapshot, not live recalculation.

### Prior-payroll variance and exports

Salary review and **Reports** compare each employee with their latest earlier
canonical APPROVED/PAID payroll in the **same currency**. Gross, deduction and net
changes are exact currency-rounded differences; net change percent uses prior
net's absolute value. No baseline is shown when none exists; prior net zero has
no percentage. No exchange rate, anomaly threshold or risk score is fabricated.

For example, if Asha's latest prior net was INR 9,924.85 and January net is
INR 12,672.44, the net change is INR 2,747.59 (27.68%). Net includes reimbursements,
so a difference is not necessarily a salary increase. Prior periods may have
different pay groups, scopes, lengths and proration. Review the saved basis and
claims rather than interpreting every difference as an error.

**Export payroll register** retains existing columns and appends variable input
IDs/names/bases/amounts/reasons, actual period employer cost, prior period/net,
gross/deduction/net changes and net percent. Old snapshots without this data
export blank new fields; they are not recalculated retrospectively. Payslip
component lines include variable earnings, deductions and employer contributions.

API additions under `/organization/hrms/payroll`:

- `POST variable-inputs`: create a pending bounded input.
- `POST variable-inputs/:id/approve`, `/reject`, `/cancel`: explicit decisions.
- `GET workspace`: includes tenant-scoped input history.
- Existing preview, run approval, processing and workspace APIs include the
  calculation/snapshot details; no separate payroll execution path was added.

Migration `20261114160000_payroll_variable_inputs` adds the input table, foreign
keys, indexes and positive-value/date-order constraints. It was deployed to the
configured development database with approval, without resetting existing data.
Other environments must deploy it before running this application version.
Pay calendars and non-monthly frequencies are described above. Configurable
variance thresholds and later roadmap stages remain unimplemented.

### Organization bank accounts: setup and verification boundaries

Open **Control -> Organization -> Settings -> Organization bank accounts**.
The existing settings sections are preserved. You need
`organization.settings.manage`; API permission enforcement is independent of UI
visibility. Accounts belong to the organization and represent possible funding
accounts, **not employee payout destinations**. Payroll is not automatically
connected to these accounts.

1. Click **Add bank account**.
2. Enter a recognizable label, legal account-holder name, bank name, bank country
   and account currency. Country/currency use the same shared catalogs as HRMS;
   they are independent choices.
3. Select **Local account + routing** or **IBAN**. Enter and confirm the account
   number/IBAN; optionally provide a SWIFT/BIC. Local accounts require a routing/
   branch code. For India the field says IFSC, for the US ABA routing number, and
   for UK local accounts sort code.
4. Save. The account appears masked, for example `IBAN **** 5432`, with status
   **Awaiting independent review**.
5. Another authorized administrator opens **Review documents**, independently
   inspects a bank-issued document for the legal name/account ending, and records
   an evidence reference and note. Keep the document in your organization's
   access-controlled evidence repository. This field stores a reference, not an
   uploaded attachment; do not enter full account details into labels or notes.
6. Acceptance becomes **Manually reviewed**, not “ownership verified.” Rejection
   becomes **Review rejected**. Both decisions are final for that account.
   **View review evidence** explicitly loads the encrypted reference/note through
   an authorized, audited endpoint; they are not included in account lists.
7. Account details cannot be edited. Use the accessible archive icon, confirm,
   then add a replacement and independently review it again. Archived accounts
   and prior review metadata remain available with **Show archived accounts**.

Example: Neha adds Acme's GBP funding account using the publicly used example IBAN
`GB82 WEST 1234 5698 7654 32` (training only, never payment instructions). Its
checksum passes; that does not prove a bank account exists. Vikram inspects the
organization's real bank document outside this training example and records its
secure evidence reference. The system reports **Manually reviewed** and continues
to display **Bank ownership: not verified**. It sends no money.

| Check/method | Available behavior | What it does not establish |
| --- | --- | --- |
| IBAN | General structure, country match and mod-97 checksum | National IBAN registry/length validation, bank existence or ownership |
| India local | 9–18 account digits and IFSC format | IFSC directory existence, ownership or transfer eligibility |
| US local | Account shape, ABA routing prefix/checksum | Active routing/account, ownership or transfer eligibility |
| UK local | 8 account digits and 6 sort-code digits | Modulus checks, directory existence or ownership |
| Other local countries | Basic alphanumeric account/routing format | Country-specific format, existence or ownership |
| Optional SWIFT/BIC | General format and country match | Registered/active bank membership |
| Independent manual review | Evidence reference/note, independent actor and timestamp | Bank-confirmed ownership or payment authorization |
| Microdeposits, open banking, provider account validation | Explicitly unavailable without a connected provider | No simulated successful verification |

`SECRETS_ENCRYPTION_KEY` must be configured by an operator using the existing
secret-encryption facility before accounts/reviews can be saved or evidence read.
Never commit a real key. Preserve access to the encryption key when rotating or
restoring data; there is no bank-key rotation/re-encryption UI in this stage.
Account number, routing/SWIFT details and review evidence are encrypted with the
existing AES-256-GCM helper. Labels, bank/holder names, country/currency and last
four characters are authorized organization metadata, not encrypted fields.
No list or mutation response returns full transfer instructions or ciphertext.
Audit events contain actor/resource identifiers, never financial contents.
Missing encryption configuration produces an explicit unavailable state; there
is no plaintext fallback.

Bank API base: `/api/control/organization/bank-accounts`. Every route requires
`organization.settings.manage` in the active tenant.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Masked account list and explicit provider/storage capabilities |
| POST | `/` | Create immutable encrypted account; returns masked metadata |
| POST | `/:id/review` | Record independent manual ACCEPT/REJECT with evidence reference/note |
| GET | `/:id/review` | Explicit audited read of review evidence; never returns account instructions |
| POST | `/:id/archive` | Archive without deleting account/review history |
| POST | `/:id/verify` | Returns HTTP 503: no bank provider connected; does not mutate verification/payment state |

The organization bank-account migration creates `organization_bank_accounts`.
No seed/reset is required. In the configured development database the exact table
already existed when deployment was attempted; schema comparison was empty and
the migration history was reconciled with explicit approval. Fresh databases
apply `20261114150000_organization_bank_accounts` normally.

### Navigation and basic flow

The tabs follow this order:

**Dashboard -> Configuration -> Salary structures -> Employee salary ->
Reimbursements -> Run payroll -> Payslips -> Reports**

Dashboard remains the landing page. Start setup in Configuration; after setup,
the monthly work is mainly approving expenses, running payroll, and checking output.
The rounded active tabs match the other HRMS pages. Arrow keys move between tabs;
Home and End select the first and last tab.

| Tab | What it answers |
| --- | --- |
| Dashboard | What is the latest run's status, and what needs attention? |
| Configuration | Which country, currency, location, and employment model are we paying? |
| Salary structures | How are earnings, deductions, and employer costs calculated? |
| Employee salary | Which structure and monthly gross apply to each employee? |
| Reimbursements | Which approved employee expenses should be added to payout? |
| Run payroll | What should we pay for a particular month, and who approved it? |
| Payslips | What is each employee's finalized salary breakdown? |
| Reports | What payroll data can Finance download for reconciliation? |

### Example organization and prerequisites

Acme Technologies has a Bengaluru office and two active employees, Asha and
Rohan. Neha from HR prepares payroll; Vikram from Finance independently approves it.
Both employees joined before November 2026 and, for this example, have no attendance
or leave exceptions requiring proration. Create the employees and organization work
location in HRMS before assigning their salary.

| Employee | November monthly gross | Approved reimbursement |
| --- | ---: | ---: |
| Asha | INR 50,000 | INR 1,500 |
| Rohan | INR 40,000 | INR 0 |

The organization needs `hrms.enabled`. Neha needs `hrms.payroll.read` and
`hrms.payroll.manage`; Vikram needs `hrms.payroll.read` and `hrms.payroll.approve`.
Management permission does not waive independent approval.

### 1. Configuration: create a pay group

Open **Configuration -> Add payroll profile**:

| Field | Example | Meaning |
| --- | --- | --- |
| Profile name | India - Bengaluru Employees | Recognizable pay-group name |
| Country | India (IN) | Select the actual country/territory from the dropdown |
| Currency | INR - Indian Rupee | Select the payroll currency from the dropdown |
| Currency decimal places | 2 | Read-only; follows the selected ISO currency |
| Work location | Bengaluru | Optional restriction to that organization location |
| Employment model | Direct employees | Employment arrangement |
| Tax / employer registration reference | Your registration reference | Stored reference; no verification or filing integration |
| Effective from | 2026-11-01 | Date from which the configuration applies |

Country and currency are independent selections: selecting a country does not
silently choose a currency. Changing country clears a previously selected work
location, and the location dropdown lists only matching-country locations.
Changing currency updates its decimal precision automatically.

Selecting Bengaluru restricts employee assignments to that work location.
Leaving location blank removes that single-location restriction, but any employee
work location present must still be active and match the profile's country.

The verification checkbox means an authorized person has independently checked
the intended local rules. It is not automated tax certification. Leave it unchecked
until that review is complete, then use **Verify rules**. Unverified profiles can be
configured and previewed, but payroll approval is blocked.

Country examples for separate groups:

| Profile | Country code | Currency | Decimal places |
| --- | --- | --- | ---: |
| India Employees | IN | INR | 2 |
| US Employees | US | USD | 2 |
| UK Employees | GB | GBP | 2 |
| Germany Employees | DE | EUR | 2 |
| UAE Employees | AE | AED | 2 |
| Japan Employees | JP | JPY | 0 |
| Kuwait Employees | KW | KWD | 3 |

Use the actual European country, such as Germany, not `EU`.
Different jurisdictions need independently verified structures, even if they share
a currency. No country's tax slabs or government rates are loaded automatically.

| Employment model | Current behavior |
| --- | --- |
| Direct employees | Can use configured local calculations |
| Contractors / consultants | Can use configured calculations; contractor-specific compliance is not automated |
| Foreign subsidiary / local provider | Configuration/salaries can be recorded; local run calculation is blocked |
| Employer of record | Configuration/salaries can be recorded; local run calculation is blocked |

There is no connected external-provider/EOR integration yet.

### 2. Salary structures: define the formula

Open **Salary structures -> Add salary structure**. Name it **Standard India
Salary** and select **India - Bengaluru Employees**.

There are three component types:

- **Earning:** part of employee gross salary.
- **Deduction:** reduces employee salary net.
- **Employer contribution:** increases employer cost, not employee take-home.

Add these components in this exact order. Again, these are fictional demonstration
deductions and contributions, not PF or tax advice.

| Code | Name | Type | Calculation | Value / basis |
| --- | --- | --- | --- | --- |
| BASIC | Basic pay | Earning | % of gross | 50 |
| HOUSING | Housing allowance | Earning | % of earlier component | 40; basis BASIC |
| OTHER | Other allowance | Earning | Remaining gross | No amount needed |
| DEDUCTION | Example employee deduction | Deduction | % of earlier component | 10; basis BASIC |
| FIXED_DED | Example fixed deduction | Deduction | Fixed amount | 200 |
| EMPLOYER | Example employer contribution | Employer contribution | % of earlier component | 8; basis BASIC |

**Fixed amount** uses a currency amount, **% of gross** uses the assigned monthly
gross, **% of earlier component** references a component above it, and **Remaining
gross** balances total earnings to gross. Place the remainder after other earnings.
Codes must be unique; a component cannot refer to a later component.

For Asha's INR 50,000 monthly gross:

| Component | Calculation | Amount (INR) |
| --- | --- | ---: |
| Basic | 50% x 50,000 | 25,000 |
| Housing | 40% x 25,000 | 10,000 |
| Other allowance | 50,000 - 25,000 - 10,000 | 15,000 |
| Total earnings / gross | Sum of earnings | 50,000 |
| Employee deduction | 10% x 25,000 | 2,500 |
| Fixed deduction | Fixed | 200 |
| Total deductions | 2,500 + 200 | 2,700 |
| Employer contribution | 8% x 25,000 | 2,000 |

```text
Monthly salary net = 50,000 - 2,700 = INR 47,300
Monthly CTC        = 50,000 + 2,000 = INR 52,000
Annual CTC         = 52,000 x 12    = INR 624,000
```

The system rejects duplicate codes, invalid references, negative remainder amounts,
earnings that do not equal gross, and deductions exceeding gross. Some arithmetic
validation occurs only when an actual employee gross amount is assigned.

### 3. Employee salary: assign and revise

Open **Employee salary -> Assign / revise salary**:

| Field | Asha | Rohan |
| --- | --- | --- |
| Employee | Asha | Rohan |
| Salary structure | Standard India Salary | Standard India Salary |
| Monthly gross | 50000 | 40000 |
| Effective from | 2026-11-01 | 2026-11-01 |

Enter **monthly gross**, not annual CTC or take-home pay. The table shows employee,
structure, currency, gross, monthly/annual CTC, salary net, and effective date.

| Employee | Gross (INR) | Salary net before reimbursements (INR) | Monthly CTC (INR) |
| --- | ---: | ---: | ---: |
| Asha | 50,000 | 47,300 | 52,000 |
| Rohan | 40,000 | 37,800 | 41,600 |

**Revision example:** Asha receives INR 55,000 gross from December 1. Add a new
assignment for the same employee/structure with `55000` and `2026-12-01`.
Do not overwrite the November assignment. December calculates:

| Item | Amount (INR) |
| --- | ---: |
| Basic | 27,500 |
| Housing | 11,000 |
| Other allowance | 16,500 |
| Gross | 55,000 |
| Total deductions | 2,950 |
| Salary net | 52,050 |
| Employer contribution | 2,200 |
| Monthly CTC | 57,200 |
| Annual CTC | 686,400 |

Approved November payroll stays unchanged. Mid-month revisions within the same pay
group are supported with calendar-day proration. Backdated revisions affecting locked payroll are blocked; automatic arrears
are not calculated. There is no general edit/delete workflow for saved profiles,
structures, or salary history: use new structures and effective-dated assignments.

### 4. Reimbursements: record and approve an expense

Open **Reimbursements -> Add reimbursement**:

| Field | Example |
| --- | --- |
| Employee | Asha |
| Expense description | Customer visit travel |
| Amount | 1500 |
| Currency | INR (dropdown) |
| Expense date | 2026-11-10 |
| Receipt / document reference | TRAVEL-2026-104 |

The claim starts **PENDING**. Vikram clicks **Approve**, making it **APPROVED**.
Asha cannot approve her own claim; an HR user may enter it on her behalf.

Claims join a payroll only if approved, unallocated, in the same currency, for
an included employee, and dated on/before the payroll month's last day. Older
eligible claims can join a later month. A USD claim is not converted into INR.

```text
Asha salary net       INR 47,300
Approved travel claim INR  1,500
Final payroll payout  INR 48,800
```

Reimbursements increase payout, not salary CTC. Approval of the run reserves its
claims, although they still display APPROVED; processing changes them to
**IN_PAYROLL**. They cannot be allocated again. The receipt field stores a reference,
not an uploaded document. Claim editing/rejection, receipt upload, and OCR are not
implemented.

### 5. Run payroll: the six drawer steps

Click **Start payroll run**.

#### Step 1: Period & scope

Choose **India - Bengaluru Employees**, **November 2026**, **All eligible employees in
pay group**, and pay date **2026-11-30**. Alternatively choose a department such as
Engineering. Department scope narrows the pay group; it does not pull in employees
without an applicable salary assignment. Pay date must be on/after month-end.
Click **Next** to calculate a preview.

New runs default to **Calendar days in pay period**. The policy includes weekends,
holidays, joining dates and leaving dates. Every recurring component, including
fixed deductions and employer contributions, is prorated. This is a declared
organization calculation policy, not a substitute for jurisdiction-specific rules.
Select **Full-month only (legacy)** if partial-month processing must remain blocked.
Saved drafts retain their original policy; older drafts without a policy remain
full-month-only. Approval recalculates using that saved policy.

**Calendar example:** salary INR 30,000, fixed deduction INR 300, employee joins
November 11 and leaves November 20: 10 payable days / 30 calendar days gives
INR 10,000 gross, INR 100 deductions and INR 9,900 net.

**Revision example:** INR 30,000 through November 15, INR 60,000 from November 16:
15/30 at each rate gives INR 45,000 gross. A recurring INR 300 deduction remains
INR 300 for the full month. A single approved unpaid day in the first segment
reduces gross by INR 1,000 and that deduction by INR 10.

Salary review displays employed, unpaid and payable days plus each revision's
monthly rate. Calendar eligibility includes inactive leavers whose recorded end
date falls in the period, provided their employment overlaps it and salary exists.
Snapshots retain employment boundaries and unpaid leave request ranges/IDs.
Components are aggregated across revisions using Decimal arithmetic
and then rounded HALF_UP individually; displayed gross/deductions/net sum the
rounded components. Tiny component-level rounding differences from a separately
rounded headline ratio are therefore possible. Monthly/annual CTC remain the last
applicable contractual rate, not annualized partial-month earnings.

Approved unpaid leave supports complete calendar-date ranges and explicit
single-date half-days. Leave is clipped to employment and the pay period.
A range recorded as five days across seven dates has no per-date allocation in
the current leave schema: calculation refuses to guess which dates are unpaid.
Resolve its allocation through the leave process; never delete valid leave just
to pass payroll. Overlapping unpaid requests and mid-month pay-group transfers
remain blocked. Same-pay-group salary revisions are supported.

#### Step 2: Validate inputs

Review attendance, leave, overtime, and reimbursements:

- Recorded absences are checked.
- Approved unpaid leave, including custom unpaid leave types, is checked.
- Pending leave and leave awaiting more information are checked.
- Overtime is not automatically calculated.
- Missing attendance is not proof of complete attendance.

These are configured checks, not statutory or attendance-completeness certification.

#### Step 3: Salary review

Inspect totals by salary component and the employee-level calculation.

| Employee | Gross (INR) | Deductions (INR) | Reimbursements (INR) | Final payout (INR) |
| --- | ---: | ---: | ---: | ---: |
| Asha | 50,000 | 2,700 | 1,500 | 48,800 |
| Rohan | 40,000 | 2,200 | 0 | 37,800 |
| Total | 90,000 | 4,900 | 1,500 | 86,600 |

Total monthly salary CTC is **INR 93,600**: INR 90,000 gross plus INR 3,600
employer contributions. This differs from employee bank payout.

#### Step 4: Exceptions

Review unverified rules, attendance/leave warnings, and unsupported bank validation.
Not every "Review" badge blocks approval: bank details are explicitly not checked
because no real bank provider is configured.

Unverified profile rules, unresolved absences, and pending/needs-info leave **block
approval**. Calendar policy deducts approved date-allocated unpaid leave; a recorded
full-day absence covered by that unpaid day is not deducted twice. A half-day leave
does not explain a full-day absence. Legacy full-month policy continues to block
approved unpaid leave. Correct inaccurate attendance through the proper attendance
process. **Never remove valid leave or attendance just to pass validation.**

#### Step 5: Approvals

Neha saves the draft. Vikram signs in and opens **Run payroll -> Review**, proceeds
through the drawer, and clicks **Approve payroll** at the final step.
Neha cannot approve the run she prepared, even if she has approval permission.

The preparation/finance/final-approval labels describe the intended review process.
Only **one independent approval** is enforced today, not three configured stages.

#### Step 6: Process

After approval, reopen the run with **Review**, proceed to **Process**, check the
confirmation checkbox, and click **Process payroll**. Processing finalizes the
approved snapshot, makes payslip data available, consumes its claims, and enqueues
payroll notifications. It does not transfer money.

### 6. Drafts, approvals, and the two run tables

| Run status | Meaning |
| --- | --- |
| DRAFT | Persisted calculation waiting for approval |
| APPROVED | Independently approved; calculation is locked |
| PROCESSED | Finalized; payslip and report data are available |
| CANCELLED | Draft closed by a payroll manager with a required reason |
| REJECTED | Draft closed by an independent payroll approver with a required reason |

Use **Save draft** to persist work. Approval recalculates current salary and
eligible claims, so the final approved amount can differ from an earlier preview.
Processing does not recalculate an approved snapshot.

Saved run profile, period, scope and proration policy are locked in the current UI.
Use **Cancel draft** or **Reject draft**, enter the required reason, correct the
underlying inputs, and create a replacement. Rejection requires someone other than
the preparer; a preparer may cancel. Closed drafts retain their snapshots,
actor/time/reason and remain in the run table, but are excluded from latest-run
dashboard totals. Only one non-closed run per profile/month/scope can exist.
These actions never release or mutate an approved/processed run, its records,
claims, or payment state. Reopening, finalized reversal and a general run-edit
workflow are still pending. Review carefully before approval.

Duplicate and overlapping employee payroll is blocked. Do not run all employees
and then attempt another department run covering those same employees/dates.

The **Payroll runs** table is one row per pay group/month/scope. **Employee payroll
records (existing API)** lists individual records, including legacy records.
Run-owned individual records can still say APPROVED when the run says PROCESSED:
these are distinct statuses, and neither means a bank transfer occurred.

### 7. Payslips

Open **Payslips**, select the processed November pay group, and click **View
payslip** for Asha. It shows employee name/number, period, pay date, earnings,
deductions, employer contributions, INR 1,500 reimbursement, and INR 48,800 net.

- **Download payslip data:** individual CSV.
- **Export payroll register:** employee-level CSV for the selected run.

Calendar-day runs show the employed/unpaid/payable basis in payslip views.
Payslip CSV data and register exports include the policy and day counts.
Older snapshots without that data continue to display as full-month calculations.

These are not PDF payslips. Automatic employee self-service document delivery is
not implemented; payroll notifications are not a payslip-document delivery feature.

### 8. Reports

Open **Reports**, select November's processed run, and click **Export payroll
register**. It contains period, employee number/name, currency, gross, deductions,
reimbursements, net, and run status. Finance can reconcile INR 86,600 employee payout.
Choose a separate country's run to inspect its currency; INR and USD are not combined.

Country statutory returns, filing documents, bank advice formats, journal vouchers,
and automated month-over-month variance reports are not generated. This tab is
currently a register/data-export surface.

### 9. Dummy bank payment

Open **Run payroll -> processed run -> Initiate bank payment (sandbox)** and confirm
the warning. One `SANDBOX-...` reference is created, with status **SUBMITTED**.

| Action | Simulated result |
| --- | --- |
| Simulate settlement | SIMULATED_SETTLED |
| Simulate failure | SIMULATED_FAILED |

Repeated submission returns the same reference. No bank is contacted, no funds
move, and payroll never becomes PAID. There is no retry/reset workflow after
simulated failure yet.

### 10. Dashboard

After processing our example, assuming no earlier runs or other claims:

| Card | Example | Current meaning |
| --- | --- | --- |
| Total payout | INR 86,600 | Most recently created run's net payout, including a draft |
| Payroll status | PROCESSED | Latest run's status; also displays draft count |
| Payslips | 2 | Employee entries across all processed runs |
| Reimbursements | 0 | Pending claim count, not monetary total |

Creating December's draft switches the payout/status cards to that run. The
checklist is an overview, not interactive task management; attendance completeness
still needs manual review and variable inputs show a pending decision count. Its Export action downloads the latest
run's register, not a certification of checklist completion.

### 11. Table controls

- Search matches across data columns.
- Filters let you select a column and enter text it should contain.
- Column-heading controls sort ascending/descending.
- Rows-per-page and previous/next controls paginate the matching records.
- Table contents scroll internally.
- Table Export downloads all matching rows, not just the visible page.
- Export does not change a payroll or claim status.

Example: in Reimbursements, open **Filters**, choose **Status**, enter `PENDING`,
search `Asha`, and export the matching claims. Dedicated **Export payroll register**
actions export their entire selected run, independently of table filters.

### 12. Troubleshooting

| Message / situation | Meaning / next step |
| --- | --- |
| No active employee salaries assigned | Add a salary assignment applicable to that pay group/month |
| Rules not verified | Independently check local rules, then mark the profile verified |
| Different payroll approver required | Ask another authorized user to approve |
| Partial-month proration required | This saved run uses legacy full-month policy; cancel the draft and create a calendar-day run if appropriate |
| Unpaid leave needs explicit calendar-date allocation | The leave range and total days do not identify which dates are unpaid; resolve allocation rather than guessing |
| Mid-period pay-group transfers | Supported salary revisions must stay within one pay group for the period |
| Payroll already overlaps this period | An existing employee payroll covers those dates; do not duplicate it |
| Location/country mismatch | Review the employee's actual location and payroll profile |
| No processed payroll | Approve and process a run before expecting payslips |
| Attendance/unpaid or pending leave warning | Resolve pending leave or unexplained absences; calendar policy supports approved date-allocated unpaid leave |

### 13. First practice run checklist

Use a test organization:

1. Create an India/INR profile.
2. Create the example structure above.
3. Assign INR 50,000 gross to one active employee.
4. Record and independently approve INR 1,500 reimbursement.
5. Start November payroll with November 30 pay date.
6. Expect INR 48,800 net payout.
7. Save a draft; another authorized user approves it.
8. Reopen, confirm, and process.
9. View the payslip data and export the register.
10. Try sandbox payment without expecting a real transfer.

Production completeness still requires country compliance, richer leave allocation,
arrears, richer approvals, PDF/ESS delivery, and actual banking.

## Configuration and scope

Payroll preserves the dashboard, seven original tabs, and six-step run drawer.
Configuration adds organization-owned pay groups for country, currency, optional
work location, employer registration reference, and employment model. Use separate
groups for India, US, UK, European, Middle Eastern, or Asian entities rather than
mixing currencies or assuming that one country's statutory rules apply elsewhere.

Profiles are monthly and effective-dated. ISO currency precision is enforced.
Local-provider and EOR profiles are recorded but cannot be processed by the local
calculation engine. Their salaries remain visible for external-provider workflows.
Creating a profile does not certify local tax or employment-law compliance.

Setup:

1. Add a profile under **Configuration**, using an active organization location
   where applicable. Independently verify the local rules before marking them verified.
2. Add a salary structure: ordered earnings, deductions, and employer contributions.
3. Assign the structure and monthly gross to employees, with an effective date.
   The employee salary table shows revision history, net, monthly CTC, and annual CTC.
4. Create and independently approve any same-currency reimbursement claims.
5. Preview, save, independently approve, and process the run.

Rules support fixed amounts, percentages of gross, percentages of an earlier
component, and an earning remainder. No arbitrary formulas or executable scripts
are accepted. Earnings must sum to gross and deductions cannot exceed earnings.
Amounts use decimal arithmetic with HALF_UP rounding at currency precision.
Monthly CTC is gross plus employer contributions; annual CTC is that monthly amount
times twelve. Reimbursements increase net payout, not salary CTC.

Structures and assignments are append-only. A new effective-dated salary assignment
is a revision, not an edit to a previous payslip. Use a new profile/structure for
rule changes. Unverified profiles can be marked verified separately after review.

## Run lifecycle

`DRAFT -> APPROVED -> PROCESSED`

Draft-only terminal branches: `DRAFT -> CANCELLED` or `DRAFT -> REJECTED`.
The partial unique active-scope database index permits replacement drafts without
deleting closed history; preserve that index in future migrations. Never replace
it with only an application-level duplicate check.

- Scope is the entire pay group or one organization department.
- The latest applicable employee salary assignment determines pay-group membership.
- A user other than the preparer must approve using `hrms.payroll.approve`.
- Approval recalculates inputs and reserves approved, unallocated expense claims.
- Approval creates linked records in the existing payroll API. Its employee/period
  unique constraint and serializable date-overlap checks prevent duplicate payroll
  across departments, profiles, and legacy free-text period labels. Existing payroll
  records are never overwritten.
- Legacy record approval cannot mutate a run-owned approval.
- Processing uses the approved immutable snapshot, consumes its claims, and enqueues
  employee notifications through the existing transactional notification outbox.
- Processed snapshots supply itemized payslips and payroll register CSV downloads.
  Register data is per run/currency, never an aggregate of unlike currencies.
- No transition marks a payroll record `PAID`.

All new routes are tenant-scoped and require the `hrms.enabled` entitlement plus
the corresponding existing payroll permission. UI permission checks are only UX;
the API enforces access independently.

### Explicit boundaries

This is configurable payroll, not a bundled global statutory engine. Country tax
slabs, statutory caps/filings, tax declarations, attendance completeness, overtime,
scheduled-working-day proration, automatic arrears, FBP elections, off-cycle/final settlement,
multi-level workflow integration, ESS delivery, PDF generation, receipt upload/OCR,
and accounting/provider-specific exports are not implemented here.

Calendar policy supports joiners/leavers, same-group mid-month revisions and
date-allocated approved unpaid leave. Legacy full-month runs retain their blockers.
Unexplained absences, ambiguous leave allocation, pending leave, mid-month pay-group
transfers and backdated salary changes affecting locked payroll fail explicitly. Missing
attendance is not interpreted as zero leave or certified attendance completion.
The finance/final-approval drawer displays the review process; there is one enforced
independent approval, not a configurable multi-stage approval engine.

Current downloads are CSV data, not statutory filing documents, bank advice, or
proof that funds were transferred.

## API

Base: `/api/organization/hrms/payroll`

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/workspace` | `hrms.payroll.read` | Profiles, structures, salary history, claims, runs, existing payroll records, employees, locations, departments |
| POST | `/profiles` | `hrms.payroll.manage` | Create country/currency pay group |
| PATCH | `/profiles/:id/verify` | `hrms.payroll.manage` | Record administrator verification of jurisdiction rules |
| POST | `/structures` | `hrms.payroll.manage` | Create ordered component rules |
| POST | `/assignments` | `hrms.payroll.manage` | Append effective-dated employee salary |
| POST | `/claims` | `hrms.payroll.manage` | Record a receipt-referenced claim |
| PATCH | `/claims/:id/approve` | `hrms.payroll.approve` | Approve a claim other than one's own |
| POST | `/runs/preview` | `hrms.payroll.read` | Validate/calculates without persisting |
| POST | `/runs` | `hrms.payroll.manage` | Persist a draft |
| PATCH | `/runs/:id/approve` | `hrms.payroll.approve` | Recalculate and lock the snapshot |
| POST | `/runs/:id/process` | `hrms.payroll.manage` | Finalize approved payroll |
| POST | `/runs/:id/cancel` | `hrms.payroll.manage` | Close a draft with `{ "reason": "..." }`, retaining its history |
| POST | `/runs/:id/reject` | `hrms.payroll.approve` | Independently reject a draft with a required reason |
| POST | `/runs/:id/sandbox-payment` | `hrms.payroll.approve` | Simulate a bank transfer |

Original list/create/individual-approval endpoints remain available for standalone
payroll records. New date-only inputs use `YYYY-MM-DD`; periods use `YYYY-MM`.
Duplicate keys and serializable write conflicts return explicit HTTP 409 errors.
Run preview/create accept optional `prorationPolicy: "CALENDAR_DAYS" | "NONE"`.
Omitting it retains legacy full-month behavior; the web UI explicitly sends
`CALENDAR_DAYS` for new runs. The selected policy is stored in the snapshot and
reused on approval, never silently changed.

## Dummy bank API

`POST /runs/:id/sandbox-payment` requires a processed run and
`{ "action": "SUBMIT", "confirmSandbox": true }`. Submission returns one
`SANDBOX-...` reference per run; repeated submissions return the same reference.
`SETTLE` or `FAIL` can transition only a submitted sandbox payment to
`SIMULATED_SETTLED` or `SIMULATED_FAILED`.

Responses always include `sandboxOnly: true` and `realFundsMoved: false`. Payroll
remains `PROCESSED`, never `PAID`; no external bank is called and no bank credentials
or actual transfer instructions are accepted.

## Deployment and verification

The additive migration
`prisma/migrations/20261114120000_hrms_payroll_workspace/migration.sql` creates five
tables and adds a nullable run relation to existing payroll records. No reset or
seed is necessary.

The subsequent `20261114140000_payroll_draft_corrections` migration adds closure
metadata and replaces the all-history unique run index with a partial unique
active-scope index. Closed drafts stay queryable. This partial index is defined
in SQL because Prisma schema declarations cannot express its predicate.

Generate the client and deploy with:

```sh
pnpm --dir apps/api db:generate
pnpm --dir apps/api db:migrate:deploy
```

Use the existing API unit and web component test runners for the payroll specs.
The database integration spec is opt-in and rolls back all synthetic test data:

```sh
cd apps/api
PAYROLL_DB_INTEGRATION=true node --env-file=.env node_modules/jest/bin/jest.js \
  --config jest.config.cjs --runInBand \
  --runTestsByPath src/modules/hrms/services/hrms-payroll-workspace.integration.spec.ts \
  src/modules/control/organization/organization-bank.integration.spec.ts
```
