import { useState } from "react";
import toast from "react-hot-toast";
import { useGetAuth } from "./useGetAuth";
import { useMutation } from "@tanstack/react-query";

export const useGenerateInvoicePDF = () => {
  const [pdfLoadingIds, setPdfLoadingIds] = useState({});
  const { loginAccessToken } = useGetAuth();

  const mutation = useMutation({
    mutationFn: async (invoiceId) => {
      const payload = {
        appProductReportId: invoiceId,
        exportProcedureName: "GetSalesTaxInvoice",
        targetSource: "SalesTaxInvoice",
        filters: JSON.stringify({ InvoiceId: invoiceId }),
        outputResultType: "PDF",
        dataExportType: "PDF",
      };

      const res = await fetch("/api/RPT/DI/GetSalesTaxInvoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message);
      return json.data;
    },

    onMutate: (invoiceId) => {
      setPdfLoadingIds((prev) => ({ ...prev, [invoiceId]: true }));
    },

    onSuccess: (data) => {
      if (data) {
        console.log("PDF generated successfully:", data);
        window.open(data, "_blank");
      } else {
        toast.error("PDF URL missing in response.");
      }
    },

    onError: (err) => {
      toast.error(err.message || "Failed to generate PDF");
    },

    onSettled: (_, __, invoiceId) => {
      setPdfLoadingIds((prev) => ({ ...prev, [invoiceId]: false }));
    },
  });

  return {
    generateInvoicePDF: mutation.mutate,
    pdfLoadingIds,
    isPending: mutation.isPending,
  };
};
