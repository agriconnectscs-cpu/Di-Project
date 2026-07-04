import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";
import { handleApiResponse } from "../utils/handleApiResponse";

export const useGetProductCategories = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["productCategories", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/DI/ProductCategory/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(res, "Failed to fetch categories");

      return result.data;
    },
    select: (data) =>
      data?.map((item, i) => ({
        ...item,
        key: item.productCategoryId,
        sr: i + 1,
      })) || [],

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
