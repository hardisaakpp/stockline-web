# Importing an order

Only people with the import permission (buyers) see **Import order**. Go to **Orders**, then **Import order**.

## Steps

1. **Choose the file**: drop or choose an Excel spreadsheet (.xlsx, up to 10 MB). Other formats are rejected. A sample template can be downloaded from the same page.
2. **Review the checks**: press _Check file_. The file is validated without creating anything.
3. **Import**: when the file is valid, press _Import order_. The order is created as a **Draft** and you can open it.

If the file has errors, fix the spreadsheet and check it again. Nothing is created until the file is valid.

## What the spreadsheet contains

The workbook has two sheets.

- **cabecera** (header): two columns, field and value. Fields: order code, order date, delivery date, supplier name and payment terms.
- **detalle** (detail): one row per product with product code, description, pack size, cost without tax, discount and retail price, followed by one column for the warehouse and one for each store with the requested units. The second row names the location code of each distribution column.

## Checks and results

The result shows a count of errors and warnings, and a table with the level, where the problem is (a row) and a message.

- **Errors** block the import.
- **Warnings** let you import, but deserve a look.
- Where possible the message suggests alternatives ("Did you mean ...?").
- An order code that already exists is rejected as a duplicate.

## What is checked

Errors (the file cannot be imported until fixed):

- The order code already exists (duplicate order code), or is too long.
- A required header field is missing, such as the order date.
- The delivery date is in the past.
- A location column is not in the catalog of locations (unknown location).
- The same product appears twice (duplicate product), or a product code is not valid.
- A price is negative.
- The discount is not between 0 and 100%. Write 20 or 0.2 for 20%.
- The pack is not valid. The expected format is like X6.
- The file has no product with quantities.

Warnings (you can import, but check them):

- The order date is more than a year old.
- A line has no quantities and will be ignored.
- The cost or the retail price is zero.
- The discount is very high, or the retail price is low compared with the cost.
- The unit cost does not match the cost and pack of the line.

## Checking against the ERP

The option _Also check the products against the ERP_ verifies that each product exists, is active and has the right pack
size and price. It is optional because it takes longer and needs the ERP to be reachable.

## After importing

The new order is a draft. Review the lines, then use **Submit to supplier** to send it. After sending, the buyer cannot
edit the quantities any more. You can still download the original file from the order's page.
