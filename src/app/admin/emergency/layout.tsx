import AdminLayout from '@/components/admin/admin-layout';

export default function EmergencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
