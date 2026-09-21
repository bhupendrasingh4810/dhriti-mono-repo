// apps/web/src/app/(marketing)/layout.tsx
import { Navbar } from "../../components/layout/marketing/navbar";
import { Footer } from "../../components/layout/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}