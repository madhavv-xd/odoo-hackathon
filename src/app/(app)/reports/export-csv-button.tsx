"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportReportsCsv } from "./actions";

export function ExportCsvButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const csv = await exportReportsCsv();
      // Trigger download in browser
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transitops-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      className="gap-1.5"
      onClick={handleExport}
      disabled={loading}
    >
      <Download className="size-4" />
      {loading ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
