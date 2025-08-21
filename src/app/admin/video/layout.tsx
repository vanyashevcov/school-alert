
import AdminLayout from '@/components/admin/admin-layout';

export default function VideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
