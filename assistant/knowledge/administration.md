# Administration

The **Administration** section is only visible to people with the administrator permission. It has four pages.

## Users

The list of people who can sign in, with their role, whether they are administrators and whether the account is active.

- **Create user**: email, name, role (buyer, supplier or supplier production), a starting password of at least 10 characters, and whether the person is an administrator.
- **Edit**: change the name, role, administrator permission or active state.
- **Reset password**: sets a new password of at least 10 characters. The person's sessions end immediately. It is only offered for local accounts.
- **The last administrator is protected**: the only active administrator cannot be disabled or lose the administrator permission, so the system is never left without one.

### Directory accounts

When Stockline is connected to the directory, people can sign in with their directory account. Their record appears in
this list the first time they sign in, with a **Directory** badge. The directory owns their name, role, administrator
access and password: they follow the directory groups at every sign-in, so to change a person's role or make them an
administrator you change their groups in the directory, not here. In Stockline you can only turn the account **off or on**
(Active). Turning it off here blocks that person even if the directory still allows them. Disabling the account in the
directory stops their next sign-in. Create user and Reset password are for local accounts only.

## Roles

A read-only matrix of what each role can do. Administrator is an extra permission that can be added to any role.

| Permission                            | Buyer | Supplier | Supplier production |
| ------------------------------------- | ----- | -------- | ------------------- |
| View orders (`orders.view`)           | yes   | yes      | yes                 |
| Act on orders (`orders.act`)          | yes   | yes      | yes                 |
| Import orders (`orders.import`)       | yes   | no       | no                  |
| Send to the ERP (`erp.submit`)        | yes   | no       | no                  |
| View the dashboard (`dashboard.view`) | yes   | yes      | yes                 |

Administrators additionally hold `admin.users`.

## Locations

The warehouses and stores that orders are distributed across. You can add a location (code, name, kind), edit its name
and active state, and for a store choose the warehouse that supplies it. A location can be a **warehouse** or a **store**.
The code and kind cannot be changed after creation.

## Notifications

Email subscriptions: who gets an email when an order reaches each step. Add an address to a topic (for example, a new
submitted order, a cancellation, a rejected child order or a failed ERP submission), remove it later, and preview what
the email looks like.
