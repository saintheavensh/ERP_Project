# B05-FIN-019

# Tax Management

## Purpose

Defines tax configuration, tax calculation, tax reporting, and tax integration across Universal Service ERP.

---

## Business Philosophy

Tax requirements differ between businesses.

The ERP must support taxation without forcing every business to use it.

---

## Official Architectural Decision

```text id="taxadr001"
Tax Engine
Always Available
```

---

```text id="taxadr002"
Tax Module
Can Be Enabled Or Disabled
```

---

## Tax Modes

### Tax OFF

Default Mode.

Suitable for:

* Small Businesses
* Non-Tax Businesses
* Businesses Not Yet Registered For Tax Reporting

---

When OFF:

* Tax Settings Hidden
* Tax Reports Hidden
* Tax Calculations Disabled

---

### Tax ON

Suitable for:

* VAT Businesses
* Tax Registered Businesses
* Growing Businesses

---

When ON:

* Tax Settings Available
* Tax Reports Available
* Tax Calculation Available

---

## Supported Tax Profiles

### No Tax

```text id="tax001"
No Tax Calculation
```

---

### Simplified Tax

```text id="tax002"
Small Business Tax
```

---

### VAT Enabled

```text id="tax003"
VAT Calculation Enabled
```

---

### Enterprise Tax

Reserved for future enhancement.

---

## Tax Configuration

Supports:

* Tax Name
* Tax Registration Number
* Tax Address
* Tax Percentage
* Effective Date

---

## Tax Integration

Connected to:

### Service Module

Supports:

* Taxable Services
* Non-Taxable Services

---

### Sales Module

Supports:

* Taxable Products
* Non-Taxable Products

---

### Purchasing Module

Supports:

* Purchase Tax
* Supplier Tax Information

---

### Finance Module

Supports:

* Tax Accounts
* Tax Reporting
* Tax Journals

---

## Tax Reporting

Provides:

* Tax Summary
* VAT Summary
* Tax Audit Reports

---

## Tax Accounts

Examples:

* Output Tax
* Input Tax
* Tax Payable

---

## Audit Trail

Track:

* Tax Configuration Changes
* Tax Rate Changes
* User
* Timestamp

---

## Summary

Tax Management provides scalable tax functionality while remaining optional for businesses that do not require it.

---

# End Of Document
