
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Página de Catálogo desativada. Redireciona para a Home.
 */
export default function CatalogoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
