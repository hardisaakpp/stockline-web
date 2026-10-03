/** Server-only entry point of the Careers feature: data loading and the views each Careers page renders. */
import { env } from "@/lib/env";

export { careersApi } from "./api";
export { ApplicationDetailView } from "./components/application-detail";
export { ApplicationsList } from "./components/applications-list";
export { CvEditor } from "./components/cv-editor";
export { OffersView } from "./components/offers-view";

/** Whether api-careers is configured. When it is not, the interface simply does not offer the module. */
export const careersEnabled = (): boolean => env.careersApiUrl !== null;
