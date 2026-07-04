import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";

export const useGetProductAreas = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["productAreas", loginAccessToken],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch("/api/DI/ProductArea/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const result = await res.json();

      if (!result?.data) throw new Error(result?.message || "No data found");

      return result.data;
    },
    select: (data) =>
      data.map((item, index) => ({
        ...item,
        key: item.productAreaId,
        sr: index + 1,
      })),

    onError: (err) => toast.error(err.message),

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
