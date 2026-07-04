import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";
import { handleApiResponse } from "../utils/handleApiResponse";

export const useGetWAQueue = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["waQueueList", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/ADM/WAQueue/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(
        res,
        "Failed to fetch WA queue items",
      );

      return Array.isArray(result?.data) ? result.data : [];
    },

    select: (data) =>
      data?.map((item, index) => ({
        ...item,
        key: item.waQueueId,
        sr: index + 1,
      })) || [],

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
