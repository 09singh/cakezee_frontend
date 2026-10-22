import api from "./axios";

export const getAnalyticsOverview = (params, { signal } = {}) =>
  api.get("/admin/analytics/overview", { params, signal }).then((response) => response.data);
