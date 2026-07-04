import { useGetAuth } from "./useGetAuth";
import { useQuery } from "@tanstack/react-query";

export const useGetAllClientArea = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["clientAreaList", loginAccessToken],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/ClientArea/GetList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
            accept: "text/plain",
          },
          body: JSON.stringify({
            start: start,
            length: pageSize,
          }),
        });

        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const result = await res.json();
        if (!result.data || !Array.isArray(result.data)) break;

        allData.push(...result.data);
        start += pageSize;
        hasMore = result.data.length === pageSize;
      }

      return allData.map((item, index) => ({
        ...item,
        key: item.clientAreaId,
        sr: index + 1,
        clientAreaId: item.clientAreaId,
        clientAreaName: item.clientAreaName,
      }));
    },
    enabled: !!loginAccessToken,

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
