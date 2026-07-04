import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";

export const useGetWebTemplates = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["webTemplateList", loginAccessToken],
    queryFn: async () => {
      const response = await fetch("/api/ADM/TemplateWeb/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      const formattedData =
        result.data?.map((item, index) => ({
          ...item,
          key: item.templateId,
          sr: index + 1,
        })) || [];

      return formattedData;
    },
    enabled: !!loginAccessToken,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
