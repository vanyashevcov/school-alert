import AdminLayout from '@/components/admin/admin-layout';

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
