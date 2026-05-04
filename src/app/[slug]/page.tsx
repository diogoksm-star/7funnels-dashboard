import { ClientDashboardShell } from "@/components/client-dashboard-shell";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ClientDashboardPage({ params }: PageProps) {
  const { slug } = await params;
  return <ClientDashboardShell slug={slug} />;
}
