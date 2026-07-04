import toast from "react-hot-toast";
import { useGetAuth } from "./useGetAuth";
import { useQuery } from "@tanstack/react-query";

import { handleApiResponse } from "../utils/handleApiResponse";

export const useGetBuyer = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["buyerList", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/CRM/Buyer/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(res);
      return result?.data || [];
    },
    onError: (err) => toast.error(err.message),

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
