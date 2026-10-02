import { z } from "zod";
import { issueSchema } from "@/lib/actions/result";

export const ORDER_STATUSES = [
  "Draft",
  "Submitted",
  "UnderReview",
  "ProductionConfirmed",
  "SupplierConfirmed",
  "ProductionPostponed",
  "ReadyForRedistribution",
  "RedistributionConfirmed",
  "ErpSubmissionFailed",
  "LogisticsPending",
  "Sent",
  "DispatchAndInvoice",
  "Completed",
  "Rejected",
  "Cancelled",
  "CancelledBySupplier",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_ACTIONS = [
  "Submit",
  "Open",
  "ConfirmProduction",
  "ConfirmBySupplier",
  "CancelBySupplier",
  "AcceptPostponed",
  "Reject",
  "Cancel",
  "ConfirmRedistribution",
  "MarkSent",
  "MarkLogisticsPending",
  "MarkErpSubmissionFailed",
  "MarkDispatchAndInvoice",
  "Complete",
] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

const statusSchema = z.enum(ORDER_STATUSES);
const decimal = z.number();

export const orderSummarySchema = z.object({
  id: z.string(),
  parentOrderId: z.string().nullable(),
  code: z.string(),
  supplierName: z.string(),
  status: statusSchema,
  orderDate: z.string(),
  deliveryDate: z.string().nullable(),
  lineCount: z.number(),
  requestedQuantity: decimal,
  confirmedQuantity: decimal,
  createdBy: z.string().nullish(),
  modifiedBy: z.string().nullish(),
  modifiedAt: z.string().nullish(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const pagedOrdersSchema = z.object({
  items: z.array(orderSummarySchema),
  page: z.number(),
  pageSize: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
});
export type PagedOrders = z.infer<typeof pagedOrdersSchema>;

export const locationSchema = z.object({
  code: z.string(),
  name: z.string().nullable(),
  kind: z.enum(["Warehouse", "Store"]),
  supplyingWarehouseCode: z.string().nullable(),
});
export type OrderLocation = z.infer<typeof locationSchema>;

const allocationSchema = z.object({
  locationCode: z.string(),
  locationName: z.string().nullable(),
  kind: z.string(),
  quantity: decimal,
});

export const orderLineSchema = z.object({
  productCode: z.string(),
  barcode: z.string().nullable(),
  description: z.string().nullable(),
  pack: z.string(),
  // Commercial data is withheld (null) from roles that must not see it.
  costWithoutTax: decimal.nullable(),
  unitCost: decimal.nullable(),
  discount: decimal.nullable(),
  retailPrice: decimal.nullable(),
  requestedQuantity: decimal,
  confirmedQuantity: decimal,
  totalQuantity: decimal,
  storeQuantity: decimal,
  allocations: z.array(allocationSchema),
  comment: z.string().nullish(),
});
export type OrderLine = z.infer<typeof orderLineSchema>;

export const orderSchema = z.object({
  id: z.string(),
  parentOrderId: z.string().nullable(),
  status: statusSchema,
  redistributionVersion: z.number(),
  header: z.object({
    code: z.string(),
    orderDate: z.string(),
    deliveryDate: z.string().nullable(),
    deliveryNote: z.string().nullable(),
    paymentTerms: z.string().nullable(),
    message: z.string().nullable(),
    supplierName: z.string(),
    buyerName: z.string().nullable(),
    buyerCode: z.string().nullable(),
    transferOrigin: z.string().nullable(),
    series: z.string().nullable(),
  }),
  locations: z.array(locationSchema),
  lines: z.array(orderLineSchema),
  createdAt: z.string().nullish(),
  modifiedAt: z.string().nullish(),
  warnings: z.array(issueSchema).nullish(),
  totals: z
    .object({
      requestedQuantity: decimal,
      confirmedQuantity: decimal,
      allocatedQuantity: decimal,
      storeQuantity: decimal,
      totalCost: decimal.nullable(),
    })
    .nullish(),
});
export type Order = z.infer<typeof orderSchema>;

export const orderActionsSchema = z.object({
  status: statusSchema,
  actions: z.array(z.enum(ORDER_ACTIONS)),
});

export const differenceSchema = z.object({
  hasDifference: z.boolean(),
  lines: z.array(
    z.object({
      productCode: z.string(),
      description: z.string().nullable(),
      requested: decimal,
      confirmed: decimal,
      difference: decimal,
    }),
  ),
});
export type OrderDifference = z.infer<typeof differenceSchema>;

export const confirmResultSchema = z.object({
  order: orderSchema,
  childOrders: z.array(z.object({ id: z.string(), code: z.string() })),
});

const planAllocationSchema = z.object({ locationCode: z.string(), quantity: decimal });

export const redistributionSchema = z.object({
  status: statusSchema,
  version: z.number(),
  locations: z.array(locationSchema),
  lines: z.array(
    z.object({
      productCode: z.string(),
      description: z.string().nullable(),
      requestedQuantity: decimal,
      confirmedQuantity: decimal,
      allocatedQuantity: decimal,
      allocations: z.array(planAllocationSchema),
    }),
  ),
  draft: z.array(
    z.object({ productCode: z.string(), locationCode: z.string(), quantity: decimal }),
  ),
});
export type Redistribution = z.infer<typeof redistributionSchema>;

export const proposalSchema = z.object({
  status: statusSchema,
  lines: z.array(z.object({ productCode: z.string(), allocations: z.array(planAllocationSchema) })),
});

export type Plan = {
  lines: { productCode: string; allocations: { locationCode: string; quantity: number }[] }[];
};

export const auditEntrySchema = z.object({
  at: z.string(),
  userId: z.string().nullable(),
  actor: z.string(),
  type: z.enum(["StatusChange", "FieldChange"]),
  productCode: z.string().nullable(),
  field: z.string(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

const erpLineSchema = z.object({
  productCode: z.string(),
  quantity: decimal,
  unitPrice: decimal.nullish(),
  discountPercent: decimal.nullish(),
});

export const erpDocumentSchema = z.object({
  id: z.string(),
  kind: z.string(),
  originWarehouse: z.string().nullable(),
  destinationLocation: z.string().nullable(),
  status: z.string(),
  attempts: z.number(),
  lastError: z.string().nullable(),
  docEntry: z.number().nullable(),
  docNum: z.number().nullable(),
  sentAt: z.string().nullable(),
  lines: z.array(erpLineSchema),
});
export type ErpDocument = z.infer<typeof erpDocumentSchema>;

export const erpSubmissionSchema = z.object({
  orderStatus: statusSchema,
  documents: z.array(erpDocumentSchema),
});
export type ErpSubmission = z.infer<typeof erpSubmissionSchema>;

export const importIssueSchema = z.object({
  severity: z.enum(["Error", "Warning"]),
  code: z.string(),
  message: z.string(),
  row: z.number().nullable(),
  field: z.string().nullable(),
  suggestions: z.array(z.string()).nullable(),
});
export type ImportIssue = z.infer<typeof importIssueSchema>;

export const importValidationSchema = z.object({
  valid: z.boolean(),
  outcome: z.string(),
  errors: z.number(),
  warnings: z.number(),
  issues: z.array(importIssueSchema),
});
export type ImportValidation = z.infer<typeof importValidationSchema>;

export const importResultSchema = z.object({
  orderId: z.string(),
  warnings: z.array(importIssueSchema),
});
