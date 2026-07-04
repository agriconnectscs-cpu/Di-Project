import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";
import { handleApiResponse } from "../utils/handleApiResponse";

export const useGetControlCategory = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["controlCategories", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/DBO/Data/GetControlCategoryForParty", {
        headers: {
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      const result = await handleApiResponse(
        res,
        "Failed to fetch control categories",
      );

      return result.data;
    },

    select: (data) =>
      data?.map((item, i) => ({
        ...item,
        key: item.controlCategoryId,
        sr: i + 1,
      })) || [],

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
