import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";
import { handleApiResponse } from "../utils/handleApiResponse";

export const useGetBuyerCategory = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["buyerCategory", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/CRM/BuyerCategory/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(res);

      return (
        result.data?.map((item, index) => ({
          ...item,
          key: item.partyCategoryId || index,
          sr: index + 1,
        })) || []
      );
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
