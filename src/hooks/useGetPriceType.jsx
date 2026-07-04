import toast from "react-hot-toast";
import { useGetAuth } from "./useGetAuth";
import { useQuery } from "@tanstack/react-query";

export const useGetPriceType = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["servicePriceTypes", loginAccessToken],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch("/api/DBO/Data/GetCriteriaForPriceType", {
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const result = await res.json();

      if (!result?.data) throw new Error(result?.message);

      return result.data || [];
    },
    onError: (err) => toast.error(err.message),

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
