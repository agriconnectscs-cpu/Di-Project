import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";

export const useGetProductScenarios = (options = {}) => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["allProductScenarios", loginAccessToken],
    queryFn: async () => {
      const response = await fetch("/api/DI/ProductScenario/GetAll", {
        headers: {
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "application/json, text/plain, */*",
        },
      });

      let result;
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch {
        result = { data: [] };
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to fetch Product Scenarios");
      }

      let rawList = [];
      if (Array.isArray(result)) {
        rawList = result;
      } else if (Array.isArray(result?.data)) {
        rawList = result.data;
      } else if (Array.isArray(result?.data?.data)) {
        rawList = result.data.data;
      } else if (Array.isArray(result?.data?.list)) {
        rawList = result.data.list;
      }

      return rawList.map((item) => ({
        productScenarioId: Number(
          item.productScenarioId || item.ProductScenarioId || 0,
        ),
        productId: Number(item.productId || item.ProductId || 0),
        scenarioId: Number(
          item.scenarioId ||
            item.ScenarioId ||
            item.criteriaSubTypeId ||
            item.CriteriaSubTypeId ||
            0,
        ),
        taxPercent:
          item.taxPercent !== undefined && item.taxPercent !== null
            ? Number(item.taxPercent)
            : item.TaxPercent !== undefined && item.TaxPercent !== null
              ? Number(item.TaxPercent)
              : item.taxPercentage !== undefined && item.taxPercentage !== null
                ? Number(item.taxPercentage)
                : item.taxRate !== undefined && item.taxRate !== null
                  ? Number(item.taxRate)
                  : 0,
        sroSaleType:
          item.sroSaleType ||
          item.SroSaleType ||
          item.saleType ||
          item.SaleType ||
          item.saleTypeName ||
          "",
        sroScheduleNo:
          item.sroScheduleNo ||
          item.SroScheduleNo ||
          item.scheduleNo ||
          item.ScheduleNo ||
          item.scheduleNoName ||
          "",
        sroItemSerialNo:
          item.sroItemSerialNo ||
          item.SroItemSerialNo ||
          item.scheduleSerialNo ||
          item.ScheduleSerialNo ||
          item.serialNo ||
          item.SerialNo ||
          "",
      }));
    },
    enabled:
      !!loginAccessToken &&
      (options.enabled !== undefined ? options.enabled : true),
    retry: 1,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    ...options,
  });
};
