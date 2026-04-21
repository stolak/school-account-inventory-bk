# LiftPay ID System

## Overview

The LiftPay ID system provides unique, sequential identifiers for all entities in the platform. Each ID follows the format: `PREFIX-YYMM-NNNNNN`

- **PREFIX**: 2-10 character identifier for the entity type
- **YYMM**: Year and month (e.g., 2510 for October 2025)
- **NNNNNN**: 6-digit sequential number starting from 100001

## Available Prefixes

| Prefix | Entity Type      | Description                   |
| ------ | ---------------- | ----------------------------- |
| LPM    | LiftPay Merchant | Merchant accounts             |
| LPB    | LiftPay Buyer    | Buyer accounts                |
| LPL    | LiftPay Loan     | Loan transactions (future)    |
| LPP    | LiftPay Payment  | Payment transactions (future) |
| LPI    | LiftPay Invoice  | Invoice records (future)      |

## Example IDs

```
LPM-2510-100001  // First merchant in October 2025
LPM-2510-100002  // Second merchant in October 2025
LPB-2510-100001  // First buyer in October 2025
LPB-2511-100001  // First buyer in November 2025
```

## Database Schema

### Sequence Tracker Table

```sql
CREATE TABLE liftpay_sequence (
  prefix VARCHAR(10) NOT NULL,
  year_month CHAR(4) NOT NULL,
  seq INT NOT NULL DEFAULT 100000,
  PRIMARY KEY (prefix, year_month)
);
```

### Entity Models

All entities now include a `liftpayId` field:

```prisma
model Merchant {
  id        String @id @default(uuid())
  liftpayId String @unique @db.VarChar(30)
  // ... other fields
}

model Buyer {
  id        String @id @default(uuid())
  liftpayId String @unique @db.VarChar(30)
  // ... other fields
}
```

## Setup Instructions

### 1. Run Database Migrations

```bash
# Run Prisma migrations to add liftpayId fields
npm run migrate

# Set up LiftPay ID system (tables, functions, triggers)
npm run setup-liftpay-ids
```

### 2. Verify Setup

```bash
# Test the system
curl -X POST http://localhost:5000/api/v1/liftpay-id/generate \
  -H "Content-Type: application/json" \
  -d '{"prefix": "LPM"}'
```

## API Endpoints

### Generate LiftPay ID

```http
POST /api/v1/liftpay-id/generate
Content-Type: application/json

{
  "prefix": "LPM"
}
```

**Response:**

```json
{
  "success": true,
  "message": "LiftPay ID generated successfully",
  "data": {
    "liftpayId": "LPM-2510-100001"
  }
}
```

### Validate LiftPay ID

```http
POST /api/v1/liftpay-id/validate
Content-Type: application/json

{
  "liftpayId": "LPM-2510-100001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "LiftPay ID is valid",
  "data": {
    "isValid": true,
    "parsed": {
      "prefix": "LPM",
      "yearMonth": "2510",
      "sequence": 100001
    }
  }
}
```

### Get Sequences for Prefix

```http
GET /api/v1/liftpay-id/sequences/LPM
```

**Response:**

```json
{
  "success": true,
  "message": "Sequences retrieved successfully",
  "data": {
    "prefix": "LPM",
    "sequences": [
      {
        "yearMonth": "2510",
        "seq": 100002
      }
    ]
  }
}
```

### Get Statistics

```http
GET /api/v1/liftpay-id/statistics
```

**Response:**

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalPrefixes": 2,
    "totalSequences": 5,
    "prefixes": [
      {
        "prefix": "LPM",
        "count": 3
      },
      {
        "prefix": "LPB",
        "count": 2
      }
    ]
  }
}
```

## Automatic ID Generation

### Database Triggers

The system automatically generates LiftPay IDs when new records are created:

```sql
-- Merchant Trigger
CREATE TRIGGER trg_merchant_liftpay_id
BEFORE INSERT ON Merchant
FOR EACH ROW
BEGIN
  IF NEW.liftpayId IS NULL OR NEW.liftpayId = '' THEN
    SET NEW.liftpayId = generate_liftpay_id('LPM');
  END IF;
END;

-- Buyer Trigger
CREATE TRIGGER trg_buyer_liftpay_id
BEFORE INSERT ON Buyer
FOR EACH ROW
BEGIN
  IF NEW.liftpayId IS NULL OR NEW.liftpayId = '' THEN
    SET NEW.liftpayId = generate_liftpay_id('LPB');
  END IF;
END;
```

### Manual Generation

You can also generate IDs manually using the service:

```typescript
import { liftpayIdService } from "./services/liftpayIdService";

// Generate a new ID
const result = await liftpayIdService.generateLiftPayId("LPM");
if (result.success) {
  console.log("Generated ID:", result.liftpayId);
}
```

## Service Usage

### LiftPayIdService

```typescript
import { liftpayIdService } from "./services/liftpayIdService";

// Generate ID
const id = await liftpayIdService.generateLiftPayId("LPM");

// Validate ID
const isValid = liftpayIdService.validateLiftPayId("LPM-2510-100001");

// Parse ID
const parsed = liftpayIdService.parseLiftPayId("LPM-2510-100001");
// Returns: { prefix: 'LPM', yearMonth: '2510', sequence: 100001 }

// Get statistics
const stats = await liftpayIdService.getStatistics();
```

## Migration Guide

### Existing Data

For existing merchants and buyers without LiftPay IDs:

1. **Backup your database**
2. **Run the migration script** to add the `liftpayId` fields
3. **Update existing records** with generated IDs:

```sql
-- Update existing merchants
UPDATE Merchant
SET liftpayId = generate_liftpay_id('LPM')
WHERE liftpayId IS NULL OR liftpayId = '';

-- Update existing buyers
UPDATE Buyer
SET liftpayId = generate_liftpay_id('LPB')
WHERE liftpayId IS NULL OR liftpayId = '';
```

### Adding New Entity Types

To add LiftPay IDs to new entity types:

1. **Add the field to Prisma schema:**

```prisma
model NewEntity {
  id        String @id @default(uuid())
  liftpayId String @unique @db.VarChar(30)
  // ... other fields
}
```

2. **Create a trigger:**

```sql
CREATE TRIGGER trg_newentity_liftpay_id
BEFORE INSERT ON NewEntity
FOR EACH ROW
BEGIN
  IF NEW.liftpayId IS NULL OR NEW.liftpayId = '' THEN
    SET NEW.liftpayId = generate_liftpay_id('NEP'); -- New Entity Prefix
  END IF;
END;
```

3. **Run migrations:**

```bash
npm run migrate
```

## Troubleshooting

### Common Issues

1. **Function not found**: Run `npm run setup-liftpay-ids`
2. **Trigger errors**: Check MySQL version compatibility
3. **Duplicate IDs**: Verify sequence table integrity

### Debug Commands

```sql
-- Check sequence table
SELECT * FROM liftpay_sequence ORDER BY prefix, year_month;

-- Test function manually
SELECT generate_liftpay_id('LPM') as test_id;

-- Check triggers
SHOW TRIGGERS LIKE 'Merchant';
SHOW TRIGGERS LIKE 'Buyer';
```

## Security Considerations

1. **Sequence Reset**: Sequences reset monthly for better organization
2. **Uniqueness**: Database constraints ensure ID uniqueness
3. **Audit Trail**: All ID generations are logged in the sequence table
4. **Prefix Control**: Only predefined prefixes are allowed

## Performance

- **Fast Generation**: Database-level function ensures quick ID generation
- **Minimal Overhead**: Triggers add minimal performance impact
- **Scalable**: System handles high-volume ID generation efficiently
- **Indexed**: Sequence table is optimized for fast lookups

## Support

For issues or questions about the LiftPay ID system:

1. Check the troubleshooting section above
2. Review the API documentation
3. Contact the development team
4. Create an issue in the project repository
