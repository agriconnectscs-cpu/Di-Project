import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";

export const useGetTemplateActivities = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["templateActivities"],
    queryFn: async () => {
      const response = await fetch(
        "/api/DBO/Data/GetCriteriaForTemplateActivity",
        {
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
            accept: "text/plain",
          },
        },
      );

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
