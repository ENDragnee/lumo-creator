import React, { Suspense } from "react";
import TemplateEditor from "@/components/create";

export default function CreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateEditor />
    </Suspense>
  );
}
