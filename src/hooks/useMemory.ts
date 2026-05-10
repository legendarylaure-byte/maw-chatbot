"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

const auth = getAuth(app);

interface MemoryFact {
  id: string;
  fact: string;
  confidence: number;
  createdAt: string;
}

export function useMemory() {
  const [userFacts, setUserFacts] = useState<MemoryFact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserFacts([]);
        return;
      }

      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/memory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserFacts(data.facts || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { userFacts, loading };
}
