import { useGetAuth } from "./useGetAuth";
import { useQuery } from "@tanstack/react-query";

export const useGetProductSubCategories = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["productSubCategories", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/DI/ProductSubCategory/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const result = await res.json();
      return result?.data || [];
    },

    select: (data) =>
      data.map((item, index) => ({
        ...item,
        key: item.productSubCategoryId,
        sr: index + 1,
      })),

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
