import toast from "react-hot-toast";
import { useGetAuth } from "./useGetAuth";
import { useQuery } from "@tanstack/react-query";

export const useGetCurrency = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["currency", loginAccessToken],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch("/api/ADM/Currency/GetAll", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch control categories");
      }

      const result = await res.json();
      return result?.data || [];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    onError: (err) => toast.error(err.message || "Failed to fetch currency"),
  });
};
