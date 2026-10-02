# Redistribution

After the supplier confirms an order (status **Supplier confirmed**, or **Ready to redistribute** for an accepted child
order), the buyer decides how the confirmed units of each product are distributed across the warehouse and the stores.
This is done in the **Redistribution** tab of the order, reached with the **Go to redistribution** button.

## The rule

For every product, the units allocated across locations must add up to the confirmed quantity. The table shows, per
product, the confirmed units, the units allocated and the balance. The balance reads _Balanced_, _N to assign_ or _N over_.
Quantities are compared with a tolerance of 0.001.

## Tools

- **Use proposal**: scales the original distribution (what the buyer requested) to what was confirmed. Review it, then save or confirm.
- **Save draft**: keeps your work without confirming. The next time you open the tab, the saved draft is loaded and you are told so.
- **Confirm redistribution**: makes the distribution final. It is only possible when every product is balanced. The page lists the problems to fix otherwise, such as a total that does not match.

You are warned if you leave the tab with unsaved changes.

## After confirming

The order becomes **Redistribution confirmed** and can be sent to the ERP. The distribution is read-only from then on.
Only buyers can redistribute.
