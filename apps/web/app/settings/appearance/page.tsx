import AppearanceTabs from "@/components/settings/AppearanceTabs";
import HeadingSmall from "@/components/settings/HeadingSmall";
import SettingsLayout from "@/components/settings/SettingsLayout";

export default function AppearancePage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <HeadingSmall title="Appearance settings" description="Update your account's appearance settings" />
        <AppearanceTabs />
      </div>
    </SettingsLayout>
  );
}
