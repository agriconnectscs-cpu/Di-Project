import toast from "react-hot-toast";
import { useGetAuth } from "./useGetAuth";
import { useQuery } from "@tanstack/react-query";

export const useGetLocations = () => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["locationList", loginAccessToken],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch("/api/ADM/ClientLocation/GetList", {
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
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    onError: (err) => toast.error(err.message || "Failed to load locations"),
  });
};
