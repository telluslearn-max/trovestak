# Trovestak Admin Guide

Welcome to the Trovestak admin guide. This document covers all aspects of managing your e-commerce platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Inventory Management](#inventory-management)
3. [Order Management](#order-management)
4. [Finance Module](#finance-module)
5. [Supplier Management](#supplier-management)
6. [Relational Mesh](#relational-mesh)
7. [eTIMS Integration](#etims-integration)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Dashboard

1. Navigate to `https://admin.trovestak.com`
2. Sign in with your Clerk credentials
3. You'll land on the main dashboard with overview statistics

### Dashboard Overview

The main dashboard displays:
- **Today's Sales**: Real-time revenue
- **Active Orders**: Orders awaiting processing
- **Low Stock Alerts**: Products below threshold
- **Recent Activity**: Latest system events

---

## Inventory Management

### Adding Products

1. Go to **Products** → **Create Product**
2. Fill in the required fields:
   - **Title**: Product name
   - **Handle**: URL-friendly identifier (auto-generated)
   - **Description**: HTML supported
   - **Collection**: Category assignment
3. Add product images via Cloudinary
4. Create variants (size, color, storage)
5. Set pricing in KES (stored as cents)
6. Enable/disable VAT per product

### Bulk Import

1. Prepare CSV with headers:
   ```csv
   title,description,price,inventory_quantity,collection
   iPhone 15 Pro,Latest iPhone,159999,50,iPhones
   ```
2. Go to **Products** → **Bulk Import**
3. Upload CSV file
4. Map fields and validate
5. Review preview before confirming

### Managing Stock

- **View Stock**: Products grid shows current quantity
- **Adjust Inventory**: Click product → Inventory tab
- **Low Stock Alerts**: Automated at 10 units (configurable)
- **Stock History**: Track all adjustments

---

## Order Management

### Processing Orders

1. Navigate to **Orders**
2. Orders show status: Pending → Processing → Shipped → Delivered
3. Click order to view details:
   - Customer info
   - Items purchased
   - Shipping address
   - Payment status
4. Update status as order progresses

### Shipping

1. Open order details
2. Click **Mark as Shipped**
3. Enter tracking details:
   - Carrier (e.g., G4S, Wells Fargo)
   - Tracking number
   - Estimated delivery
4. Customer receives automated email

### Refunds

1. Open order
2. Click **Issue Refund**
3. Select items or full order
4. Process M-Pesa reversal
5. Order status updates to Refunded

---

## Finance Module

### Cash Book

Track all cash transactions:

1. **Add Entry**: Cash Book → New Entry
   - Type: Income/Expense
   - Category: Sales, Rent, Utilities, etc.
   - Amount in KES
   - Date and description
2. **View Reports**: Filter by date range
3. **Reconcile**: Match with bank statements

### Bank Statements

1. Upload statement CSV
2. System auto-matches transactions
3. Review unmatched items
4. Manually match or create rules

### Monthly Reports

Generate reports for:
- Profit & Loss
- Cash Flow
- Tax Liability (VAT)

---

## Supplier Management

### Adding Suppliers

1. Go to **Suppliers** → **Add Supplier**
2. Enter details:
   - Company name
   - Contact person
   - Email & phone
   - Payment terms (Net 30, Net 60, etc.)
   - KRA PIN (for eTIMS)

### Purchase Orders

1. Create PO from supplier page
2. Add line items
3. Send via email or download PDF
4. Track delivery status
5. Mark as received to update inventory

### Supplier Performance

View analytics:
- On-time delivery rate
- Product quality ratings
- Price competitiveness
- Total spend

---

## Relational Mesh

### Device Compatibility

Set up "Works With" relationships:

1. Go to **Mesh** → **Compatibility Rules**
2. Create rule:
   - Primary product (e.g., AirPods Pro)
   - Compatible devices (iPhone, iPad, Mac)
   - Compatibility level (Full, Partial, Limited)
3. Display on product pages

### Trade-In Program

1. **Set Valuations**:
   - Device model
   - Condition grades (Excellent, Good, Fair)
   - Trade-in value
2. **Process Trade-Ins**:
   - Customer submits device details
   - System generates quote
   - Inspection confirms condition
   - Credit applied to purchase

### Upsell Bundles

Create product bundles:

1. Go to **Mesh** → **Bundles**
2. Add products with bundle pricing
3. Display on cart/checkout
4. Track bundle performance

---

## eTIMS Integration

### KRA Compliance

Trovestak integrates with KRA's eTIMS for tax compliance:

### Invoice Generation

Every order automatically:
1. Generates eTIMS-compliant invoice
2. Includes QR code for verification
3. Submits to KRA in real-time
4. Stores CU number for records

### Troubleshooting

**Issue**: Invoice submission fails
- Check KRA API credentials
- Verify internet connectivity
- Review error logs in **Settings** → **eTIMS**

**Issue**: QR code not scanning
- Ensure printer resolution is 300dpi+
- Verify invoice printed at 100% scale

---

## Troubleshooting

### Common Issues

**Can't upload images**
- Verify Cloudinary credentials
- Check file size (< 10MB)
- Supported formats: JPG, PNG, WebP

**Orders not syncing**
- Check Medusa backend status
- Verify API keys
- Review webhook logs

**Email not sending**
- Validate Resend API key
- Check domain verification status
- Review spam folder

### Getting Help

- **Documentation**: https://docs.trovestak.com
- **Support Email**: support@trovestak.com
- **Emergency Line**: +254-XXX-XXXXXX

### Backup & Recovery

- Database: Automated daily backups (Neon)
- Media: Cloudinary keeps all versions
- Code: GitHub repository

---

## Quick Reference

### Keyboard Shortcuts

- `Cmd/Ctrl + K`: Quick search
- `Cmd/Ctrl + N`: New item
- `Esc`: Close modal
- `?`: Show help

### Important URLs

- **Storefront**: https://trovestak.com
- **Admin**: https://admin.trovestak.com
- **API**: https://api.trovestak.com

### Contact

**Trovestak Support**
- Email: support@trovestak.com
- Hours: Mon-Fri 9am-6pm EAT
- Response time: < 4 hours

---

*Last updated: February 2025*
