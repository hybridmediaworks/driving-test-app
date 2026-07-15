import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export default async function MotorcyclePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;

  return (
    <WebLayoutProvider stateSlug={state}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="states" />
        <main className="flex-1" />
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
