// Builds public/samples/order-template.xlsx (run with: npm run sample:template).
import { writeFile } from "node:fs/promises";
import { buildOrderTemplate } from "../e2e/helpers/order-template.ts";

const output = process.argv[2] ?? "public/samples/order-template.xlsx";
const code = process.argv[3] ?? "PO-SAMPLE-001";
await writeFile(output, await buildOrderTemplate({ code }));
process.stdout.write(`wrote ${output} (${code})\n`);
