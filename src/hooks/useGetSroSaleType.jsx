import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";

export const useGetSroSaleType = (options = {}) => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["sroSaleType", loginAccessToken],
    queryFn: async () => {
      const response = await fetch(
        "/api/DBO/Data/GetCriteriaForSroSaleType",
        {
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
            accept: "text/plain",
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to fetch SRO Sale Type");
      }

      return result?.data || [];
    },
    enabled: !!loginAccessToken && (options.enabled !== undefined ? options.enabled : true),
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    ...options,
  });
};
