# Supplier review and confirmation

## Reviewing an order

When an order is **Submitted**, the supplier side opens it with **Start review**, and it becomes **Under review**.
While under review, quantities and comments can be edited directly in the lines table: click a number, type, and the
change is saved when you leave the field.

- **Supplier production** can edit confirmed quantities and comments, but never sees costs.
- **Supplier** can edit quantities, comments and costs.
- The buyer does not edit lines at this stage.

## Confirming production

The production team presses **Confirm production** when its quantities are final. The order becomes **Production confirmed**.
After that, production no longer sees the order: it is only visible while it is Submitted or Under review. When this
happens you are taken back to the orders list with a message.

## Confirming the order

The supplier presses **Confirm order**. The buyer can also confirm. If everything requested was confirmed, the order
becomes **Supplier confirmed** right away.

## Missing units: confirmed fewer units than requested

Missing units are the units requested but not confirmed. When the supplier confirms an order that has missing units, the confirmation is not immediate: a dialog asks what to do with them, either skip them or deliver them later in child orders. The dialog lists each product with the units requested, confirmed and missing, and asks what happens with the missing units.

- **Skip them**: the missing units will not be delivered on this order.
- **Deliver them later in child orders**: you split the missing units into one or more child orders, each with its own delivery date. The dialog shows how many units are left to assign for each product, and warns if you assigned more than what is missing. Child orders are created as **Production postponed**.

Confirming is only possible when every product is fully assigned (or skipped).

## Cancelling an order (supplier)

Cancelling is a separate decision, unrelated to missing units. After production confirmed, the supplier can cancel the order with **Cancel order**; the status becomes **Cancelled by
supplier**, the buyer is notified, and it cannot be undone.

## Postponed child orders

A child order starts as **Production postponed**. The buyer can **Accept** it (it moves to _Ready to redistribute_) or
**Reject** it (final).
