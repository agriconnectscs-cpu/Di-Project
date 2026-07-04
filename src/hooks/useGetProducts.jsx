import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";
import { handleApiResponse } from "../utils/handleApiResponse";

export const useGetProducts = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["products", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/ISPM/Product/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(res, "Failed to fetch products");

      return result.data;
    },
    select: (data) =>
      data?.map((item, i) => ({
        ...item,
        key: item.productId || i,
        sr: i + 1,
      })) || [],

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
