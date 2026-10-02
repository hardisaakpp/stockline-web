# Order lifecycle and statuses

Every order moves through statuses. The detail page shows a progress tracker for the main path, and the orders list
shows a colored badge for the current status.

## The main path

1. **Draft**: the buyer imported the order and has not sent it yet.
2. **Submitted**: the buyer sent it to the supplier.
3. **Under review**: someone on the supplier side opened it (action _Start review_) and is working on the quantities.
4. **Supplier confirmed**: the supplier confirmed the order.
5. **Redistribution confirmed**: the buyer fixed how the confirmed units are distributed across locations.
6. **Sent**: the ERP accepted the order and created its documents.
7. **Completed**: the order was dispatched, invoiced and closed as delivered.

## Statuses between steps

- **Production confirmed**: the production team entered its quantities; the supplier still has to confirm the order. It sits between _Under review_ and _Supplier confirmed_.
- **Ready to redistribute**: a postponed child order that the buyer accepted. It behaves like _Supplier confirmed_: the next step is redistribution.
- **ERP submission failed**: the ERP rejected the order. The buyer can fix the problem and retry. It sits between _Redistribution confirmed_ and _Sent_.
- **Logistics pending**: the ERP created some documents but others are waiting. The buyer can retry.
- **Dispatch & invoice**: the goods left and were invoiced. The next step is completing the order.

## Statuses off the main path

- **Production postponed**: a child order created when production could not deliver everything. The buyer accepts it (it goes on to redistribution) or rejects it.
- **Rejected**: the buyer rejected a postponed child order. Final.
- **Cancelled**: the buyer cancelled the order. Final.
- **Cancelled by supplier**: the supplier cancelled after production confirmed. Final.

## Who can do what

| Action                                        | Who                                  | From status                                        |
| --------------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| Submit to supplier                            | Buyer                                | Draft                                              |
| Start review                                  | Buyer, Supplier, Supplier production | Submitted                                          |
| Confirm production                            | Supplier production                  | Under review                                       |
| Confirm order                                 | Supplier, Buyer                      | Under review, Production confirmed                 |
| Cancel order (supplier)                       | Supplier                             | Production confirmed                               |
| Accept postponed order                        | Buyer                                | Production postponed                               |
| Reject                                        | Buyer                                | Production postponed                               |
| Cancel order (buyer)                          | Buyer                                | Draft, Submitted, Under review, Supplier confirmed |
| Go to redistribution / confirm redistribution | Buyer                                | Supplier confirmed, Ready to redistribute          |
| Mark dispatched & invoiced                    | Supplier, Buyer                      | Sent                                               |
| Complete order                                | Supplier, Buyer                      | Dispatch & invoice                                 |

Moving to _Sent_, _Logistics pending_ or _ERP submission failed_ is done by the system when it talks to the ERP, not by a person.
The buttons on an order's page show only the actions available to you in the current status. Steps that cannot be
undone ask for confirmation first.

## The "waiting for you" list

The dashboard and the orders list can show only the orders where it is your turn. That is the orders whose current status
has at least one action available to your role.
