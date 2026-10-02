# Getting started with Stockline

Stockline is a purchase-order workflow for retail supply. A **buyer** sends an order to a **supplier**, the supplier
confirms what it can produce, the buyer decides how the confirmed units are distributed across warehouses and stores,
and the order is pushed to the ERP, which creates purchase orders and transfer requests.

## Signing in

Open the sign-in page. If your organisation connects Stockline to its directory (Active Directory), the page offers two
options: **Directory account** (the default) and **Local account**.

- **Directory account**: type your usual username (for example `ben.buyer`) or your email, and your usual password, the ones you use for the rest of the organisation's systems. Your role is decided by the directory groups you belong to: if none of them gives access to Stockline you are told that your account is recognised but not authorized, and an administrator has to add you to the right group in the directory.
- **Local account**: type your email and the password Stockline stores for you. Administrators and demo accounts use this.

Without a directory, the page only asks for your email and password. Your session lasts as long as you keep using the app: it renews
itself in the background. When you sign out, the session ends immediately. If an administrator disables your account or
changes your role, the change applies on your next click; you do not have to wait for anything to expire.

## Roles

There are three roles. An administrator is not a role: it is an extra permission that can be added to any role.

- **Buyer** creates and imports orders, sends them to the supplier, redistributes confirmed units, and sends orders to the ERP.
- **Supplier** reviews orders, edits confirmed quantities and costs, and confirms or cancels the order. The supplier also marks orders as dispatched and invoiced, and completes them.
- **Supplier production** is the supplier's production team. It enters the quantities production can make, but it never sees costs, and it can only open orders that are submitted or under review.

## Navigation

The sidebar has **Dashboard** and **Orders**. People with the administrator permission also see an **Administration**
section with **Users**, **Roles**, **Locations** and **Notifications**. Items you cannot use are hidden.

## Language, theme and number format

Use the language switcher in the top bar to change between English and Spanish. The choice is remembered. Use the theme
button to switch between light and dark. Dates follow the language; amounts always use the format 1,234.56 in US dollars.

## The assistant

Xia, the assistant, does two things.

- **Explains how Stockline works**, using this documentation, and cites the documents it used.
- **Looks up your orders** (read-only): how many are waiting for you, orders in a given status, or the details of an order by its code. It uses your own access, so it only shows what you are allowed to see, and when it answers with order data it shows which lookup it used and offers a link to open each order.

It cannot act for you: it cannot cancel, confirm, send or edit anything. For that it explains the steps and you do them
in the application. Each person has a limited number of questions per period, and the remaining count is shown in the
chat. It never asks for your password or any other secret.
