export const dynamic = "force-dynamic";
import { TopBar } from "@/components/layout/TopBar";
import { CreateTripForm } from "@/components/trips/CreateTripForm";

export default function NewTripPage() {
  return (
    <>
      <TopBar title="Create Trip" backHref="/trips" />
      <CreateTripForm />
    </>
  );
}
