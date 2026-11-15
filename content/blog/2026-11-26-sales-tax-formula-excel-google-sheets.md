---
title: Sales Tax Formula in Excel and Google Sheets (Copy and Paste)
description: Copy these sales tax formulas for Excel and Google Sheets: add tax, remove tax and round to the cent, with a ready table you can set up in two minutes.
date: 2026-11-26
tags: Sales Tax, Calculations
toolId: salestax
keywords: sales tax formula excel, sales tax formula google sheets, how to calculate sales tax in excel, excel formula to add tax, remove sales tax excel
image: /images/blog/sales-tax-formula-excel-google-sheets.jpg
imageAlt: Spreadsheet formula for sales tax: =ROUND(A2*B2,2)
---

A spreadsheet is a fast way to calculate sales tax for a price list or a month of orders. The formulas are the same in Excel and Google Sheets.

## Set up the columns

| Column | Content | Example |
|---|---|---|
| A | Price before tax | 249.99 |
| B | Tax rate | 7.25% |
| C | Sales tax | formula |
| D | Total | formula |

Type the rate as a percentage (7.25%) or as a decimal (0.0725). Either works.

## Formula 1: sales tax amount

In cell C2:

`=ROUND(A2*B2,2)`

This multiplies the price by the rate and rounds to the cent. For 249.99 at 7.25%, the result is **18.12**.

## Formula 2: total with tax

In cell D2:

`=A2+C2`

Or in one step, without a tax column:

`=ROUND(A2*(1+B2),2)`

The total is **268.11**.

![Spreadsheet example: 249.99 at 7.25% gives tax 18.12 and total 268.11](/images/blog/sales-tax-formula-excel-google-sheets-example.jpg)

## Formula 3: remove tax from a total

If A2 holds a total that includes tax:

`=ROUND(A2/(1+B2),2)`

A total of $107.25 at 7.25% gives **$100.00**. The tax part is then `=A2-ROUND(A2/(1+B2),2)`, which is $7.25. See [how to calculate the price before sales tax](/blog/remove-sales-tax-from-total/).

## Formula 4: add up a whole column

For the total tax on 100 rows:

`=SUM(C2:C101)`

To tax only the rows marked "Yes" in column E, use:

`=SUMIF(E2:E101,"Yes",A2:A101)*B2`

This adds the taxable amounts and then applies the rate once, which matches the method in [sales tax on multiple items](/blog/sales-tax-on-multiple-items/).

## Tips for fewer errors

1. **Keep the rate in one cell** and refer to it as `$B$2` so you can change it in one place.
2. **Round on the tax line,** not on every intermediate step.
3. **Format money cells** with two decimals.
4. **Mark taxable lines** so non-taxable items do not get taxed by mistake.

## When a calculator is faster

For a single invoice, a calculator is quicker than a spreadsheet. Enter the price and the rate and get the tax and the total at once.

## FAQ

### What is the formula for sales tax in Excel?

Multiply the price by the rate and round: `=ROUND(A2*B2,2)`.

### How do I add sales tax to a price in Google Sheets?

Use `=ROUND(A2*(1+B2),2)` where A2 is the price and B2 is the rate.

### How do I remove sales tax in a spreadsheet?

Divide the total by 1 plus the rate: `=ROUND(A2/(1+B2),2)`.

### Is this tax advice?

No. It shows the spreadsheet math. Which items are taxable depends on your state.
