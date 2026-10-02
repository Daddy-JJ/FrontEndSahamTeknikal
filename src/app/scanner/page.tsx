import { ScannerDashboard } from "@/components/scanner-dashboard";

export default function ScannerPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ScannerDashboard {...props} />;
}
