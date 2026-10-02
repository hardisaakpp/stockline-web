import JSZip from "jszip";

/**
 * Builds a valid order import template (.xlsx) with fictitious data. An .xlsx is a zip of XML
 * parts; strings are written inline so no styles or shared-string parts are needed.
 * Used by the e2e suite (one unique order code per test) and by `npm run sample:template`.
 */
export type TemplateOptions = {
  code: string;
  supplier?: string;
  orderDate?: string;
  deliveryDate?: string;
};

type Cell = string | number | null;

const STORES = ["ST-001", "ST-002", "ST-003", "ST-004"];

const PRODUCTS: readonly [string, string, string, number, number, number, ...number[]][] = [
  ["SKU-1001", "Stainless water bottle 750 ml", "X6", 4.8, 0.05, 11.99, 12, 6, 6, 4, 2],
  ["SKU-1002", "Bamboo cutting board", "X4", 6.2, 0, 14.5, 8, 4, 4, 2, 0],
  ["SKU-1003", "Ceramic mug set", "X2", 9.75, 0.1, 24.0, 6, 3, 3, 3, 3],
  ["SKU-1004", "Cotton kitchen towel", "X12", 3.1, 0, 7.25, 24, 12, 12, 6, 6],
  ["SKU-1005", "Glass storage jar 1 L", "X6", 5.4, 0.02, 12.9, 0, 5, 5, 5, 5],
];

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function columnName(index: number): string {
  let name = "";
  for (let n = index; n > 0; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

function cell(ref: string, value: Cell): string {
  if (value === null || value === "") return "";
  if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function sheet(rows: Cell[][]): string {
  const body = rows
    .map(
      (row, r) =>
        `<row r="${r + 1}">${row.map((value, c) => cell(`${columnName(c + 1)}${r + 1}`, value)).join("")}</row>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const CT = "application/vnd.openxmlformats-officedocument.spreadsheetml";

export async function buildOrderTemplate(options: TemplateOptions): Promise<Buffer> {
  const header: Cell[][] = [
    ["CAMPO", "VALOR"],
    ["CODIGO PEDIDO", options.code],
    ["FECHA DE PEDIDO", options.orderDate ?? "2026-10-01"],
    ["FECHA DE ENTREGA", options.deliveryDate ?? "2026-10-15"],
    ["NOMBRE PROVEEDOR", options.supplier ?? "Northwind Supply Co."],
    ["FORMA DE PAGO", "Net 30"],
  ];
  const detail: Cell[][] = [
    [
      "Codigo Producto",
      "Descripcion",
      "Pack",
      "Costo sin IVA",
      "Descuento",
      "PVP",
      "Bodega",
      "Downtown",
      "Riverside",
      "Lakeside",
      "Hillcrest",
    ],
    [null, null, null, null, null, null, "WH-MAIN", ...STORES],
    ...PRODUCTS.map((product) => [...product]),
  ];

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${CT}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${CT}.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="${CT}.worksheet+xml"/></Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${MAIN}" xmlns:r="${REL}"><sheets><sheet name="cabecera" sheetId="1" r:id="rId1"/><sheet name="detalle" sheetId="2" r:id="rId2"/></sheets></workbook>`,
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`,
  );
  zip.file("xl/worksheets/sheet1.xml", sheet(header));
  zip.file("xl/worksheets/sheet2.xml", sheet(detail));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
