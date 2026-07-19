"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

// Phaser cannot run SSR — dynamic import with ssr:false is mandatory
const PhaserGame = dynamic(() => import("@/components/game/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-blue-400 text-lg font-mono mb-2">
          Cargando sala de urgencias...
        </div>
        <div className="text-gray-600 text-sm">Iniciando diagnóstico</div>
      </div>
    </div>
  ),
});

export default function GamePage() {
  const params = useParams();
  const levelId = params.levelId as string;

  return (
    <main className="min-h-screen bg-gray-950">
      <PhaserGame levelId={levelId} />
    </main>
  );
}
