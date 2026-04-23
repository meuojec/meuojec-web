// app/dashboard/miembros/nuevo/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MemberWizardForm from "./MemberWizardForm";

export default function NuevoMiembroPage() {
  return (
    <div className="max-w-[1200px] mx-auto">
      <MemberWizardForm />
    </div>
  );
}