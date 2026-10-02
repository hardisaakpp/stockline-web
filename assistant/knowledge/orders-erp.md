# ERP integration

Once the redistribution is confirmed, the buyer sends the order to the ERP from the **ERP** tab. The ERP creates
documents for the order: **purchase orders** (what is bought from the supplier) and **transfer requests** (moving
stock from a warehouse to stores).

## Sending

Press **Send to ERP** and confirm. The request is processed in the background: the page updates by itself when the ERP
answers, so you do not need to refresh. Sending is safe to repeat: documents that were already sent are not duplicated.
Sending requires the ERP submission permission, which buyers have.

## Results

- **Sent**: all documents were created. The order moves to _Sent_.
- **Logistics pending**: some documents are still waiting. You can retry.
- **ERP submission failed**: the ERP rejected something. The tab shows the last error for each document. Fix the cause and press **Retry submission**.

## The documents table

For each document the tab shows its kind (purchase order or transfer request), the route, its status (_Pending_, _Sent_
or _Failed_), the number of attempts, the ERP document number, and when it was sent. A **PDF** link is available for
documents the ERP already created. Supplier production does not see ERP documents or costs.

## Correcting a product code

A common reason for failure is a wrong product code. When the order is in _ERP submission failed_, the buyer sees
**Correct a product code**: enter the current (wrong) code and the new one, and press **Replace code**. Then retry the
submission.

## After sending

When the order is _Sent_, the supplier or the buyer marks it **dispatched & invoiced** once the goods left and were
invoiced, and then completes it with **Complete order**.
