import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

import { useGetAuth } from "./useGetAuth";

export const useUploadFiles = () => {
  const { loginAccessToken } = useGetAuth();

  const { mutateAsync: uploadFiles, isPending: isUploading } = useMutation({
    mutationFn: async ({ file, pathUrl }) => {
      const formData = new FormData();
      formData.append("File", file);
      if (pathUrl) {
        formData.append("UploadRequestFrom", pathUrl);
      }

      const res = await fetch("/api/DBO/File/UploadFileWithThumb", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message);
      return result.data;
    },
    onError: (err) => toast.error(err.message),
  });

  return { uploadFiles, isUploading };
};
