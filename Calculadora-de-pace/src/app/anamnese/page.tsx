
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Página de Anamnese desativada. Redireciona para a Home.
 */
export default function AnamnesePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
