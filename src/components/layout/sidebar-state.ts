/** Whether the desktop sidebar is open lives in a cookie, so the server renders the right state with no flash. */
export const SIDEBAR_COOKIE = "sidebar_state";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Open unless the person closed it: a missing or unknown value never hides the navigation. */
export const parseSidebarOpen = (value: string | undefined): boolean => value !== "closed";

export const sidebarCookie = (open: boolean): string =>
  `${SIDEBAR_COOKIE}=${open ? "open" : "closed"}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
