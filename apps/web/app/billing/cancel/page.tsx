"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export default function BillingCancelPage() {
  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-lg space-y-4 px-5 py-20 text-center">
            <h1 className="text-2xl font-semibold text-neutral-900">Checkout canceled</h1>
            <Paragraph color="muted">No charge was made. You can try again anytime.</Paragraph>
            <Button href="/pricing">Back to pricing</Button>
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
