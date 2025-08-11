import AdminLayout from '@/components/admin/admin-layout';

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
