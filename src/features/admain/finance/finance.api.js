import api from "../../../api/axios";

export const getFinance = (filters) =>
  api.get("/finance", { params: filters }).then((response) => response.data?.data);

export const createFinanceAdjustment = (adjustment) =>
  api.post("/finance/refunds", adjustment).then((response) => response.data?.data);

export const getFinanceInvoice = (orderId) =>
  api.get(`/finance/invoices/${encodeURIComponent(orderId)}`).then((response) => response.data?.data);
