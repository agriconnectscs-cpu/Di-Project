import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";
import toast from "react-hot-toast";

const useGetProductTypes = (options = {}) => {
  const { loginAccessToken } = useGetAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["productTypes", loginAccessToken],
    enabled: !!loginAccessToken && options.enabled !== false,
    ...options,
    queryFn: async () => {
      const res = await fetch("/api/DI/ProductCategory/GetProductType", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch product types");
      const result = await res.json();
      return result?.data || [];
    },
    onError: (err) => toast.error(err.message),

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    productTypes: data || [],
    productIsLoading: isLoading,
    isError,
    error,
  };
};

export { useGetProductTypes };
