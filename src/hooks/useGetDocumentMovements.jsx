import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";

export const useGetDocumentMovements = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["documentMovements"],
    queryFn: async () => {
      const response = await fetch("/api/ADM/DocMovement/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify({
          filters: JSON.stringify({ IsAddAllCall: true }),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      return result.data || [];
    },
    enabled: !!loginAccessToken,
    retry: false,

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
