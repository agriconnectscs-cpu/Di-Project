import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { useGetAuth } from "./useGetAuth";

export const useGetRoles = (enabled = true) => {
  const { loginAccessToken } = useGetAuth();

  return useQuery({
    queryKey: ["roleList", loginAccessToken],
    enabled: !!loginAccessToken && enabled,

    queryFn: async () => {
      const res = await fetch("/api/ADM/Role/GetAll", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const result = await res.json();

      if (!result?.data || !Array.isArray(result.data)) {
        throw new Error(result?.message || "Invalid role data");
      }

      return result.data.map((item, index) => ({
        key: String(item.roleId ?? index),
        sr: index + 1,

        roleId: item.roleId,
        roleName: item.roleName,
        rowVersionLong: item.rowVersionLong,

        totalLocations: item.roleLocationRequests?.length ?? 0,
        roleLocationRequests: item.roleLocationRequests ?? [],
        deletedRoleLocationRequests: item.deletedRoleLocationRequests ?? [],
      }));
    },

    onError: (err) => {
      toast.error(err?.message || "Failed to load roles");
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
