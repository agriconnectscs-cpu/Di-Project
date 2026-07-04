import toast from "react-hot-toast";
import { useGetAuth } from "./useGetAuth";
import { useQuery } from "@tanstack/react-query";

export const useGetInvoices = (filters = {}, advFilters = []) => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["invoiceList", loginAccessToken, filters, advFilters],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      const payload = {
        draw: 0,
        start: 0,
        length: 1000,
        filters: JSON.stringify(filters),
        dynamicFilters: advFilters.length > 0 ? advFilters : [],
        search: { value: "", regex: "false" },
        order: [{ column: 0, dir: "asc" }],
      };

      const res = await fetch("/api/DI/Invoice/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const result = await res.json();

      if (!result?.data) throw new Error(result?.message || "No data found");

      return result.data;
    },

    select: (data) =>
      data.map((item, i) => ({
        ...item,
        key: item.invoiceId || i,
        sr: i + 1,
      })),

    onError: (err) => toast.error(err.message || "Failed to load invoices"),

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
