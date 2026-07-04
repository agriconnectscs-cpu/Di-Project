import { useQuery } from "@tanstack/react-query";

import { useGetAuth } from "./useGetAuth";
import { handleApiResponse } from "../utils/handleApiResponse";

export const useGetUserList = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["userList", loginAccessToken],
    queryFn: async () => {
      const res = await fetch("/api/ADM/User/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(res, "Failed to fetch user list");
      if (!result.data || !Array.isArray(result.data)) return [];

      return Array.isArray(result?.data) ? result.data : [];
    },

    select: (data) =>
      [...data].map((item, index) => ({
        ...item,
        key: item.userId,
        sr: index + 1,
      })),

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
