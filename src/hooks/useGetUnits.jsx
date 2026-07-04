import { useGetAuth } from "./useGetAuth";
import { useQuery } from "@tanstack/react-query";

export const useGetUnits = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["units", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/DI/Unit/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const result = await res.json();

      if (!result?.data) throw new Error(result?.message || "No data found");

      return result.data;
    },

    select: (data) =>
      data.map((item, index) => ({
        ...item,
        key: item.unitId,
        sr: index + 1,
      })),

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
