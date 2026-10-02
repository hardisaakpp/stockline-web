# Frequently asked questions and troubleshooting

## I cannot see an order that I could see a moment ago

If you are on the supplier production team, orders are only visible while they are Submitted or Under review. After you
confirm production, the order passes to the supplier and disappears from your list. This is expected.

## I do not see the Import order button

Importing needs the import permission, which only buyers have. Ask an administrator if your role should change.

## I do not see costs or prices

Supplier production never sees costs. Retail prices are shown only to buyers.

## "Your account is recognised, but it isn't authorized to use Stockline"

You signed in with your directory account and the password is right, but none of your directory groups gives access to
Stockline. An administrator has to add you to the Stockline group for your role (buyers, suppliers or supplier production)
in the directory. Nothing can be fixed from the Stockline side for you.

## I cannot sign in with my directory account

Check that **Directory account** is selected, and use your username or email, not a Stockline-only password. A wrong
password and an unknown user get the same message on purpose. If the page says the directory could not be reached, wait a
moment and try again, or use a local account if you have one. A directory account cannot sign in with the Local option.

## The page says I am not allowed

You opened something your role does not include, for example the Administration pages without the administrator
permission. You are shown a "forbidden" page. Ask an administrator.

## My import has errors

Read the table of checks: it tells you the row and what is wrong, and sometimes suggests the right value. Fix the
spreadsheet and check it again. Typical causes are a duplicate order code, a delivery date in the past, an unknown location column, a pack that is not like X6, or a discount outside 0 to 100%.

## The ERP rejected my order

The order is in _ERP submission failed_. Open the ERP tab, read the last error of the failed document, fix the cause (often
a wrong product code, which you can correct there) and press **Retry submission**. Retrying is safe.

## The redistribution will not confirm

Every product must add up exactly to its confirmed quantity. The page lists the products that do not. Use
**Use proposal** to start from a balanced distribution, adjust it, and confirm.

## Why does the page update by itself?

When someone changes an order you are looking at, for example the ERP answers, the page refreshes automatically. If the
connection drops it reconnects and refreshes again.

## The assistant says it has no information

Xia only answers from the Stockline documentation, and says so when it does not cover the question. It does not know
live data such as the status of a particular order. Try rephrasing, or ask about how a step works.

## Where do I change the language or the theme?

In the top bar: the language switcher and the theme button.
