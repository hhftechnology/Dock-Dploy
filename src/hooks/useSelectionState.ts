import { useState, useCallback } from "react";

export interface UseSelectionStateReturn {
  selectedIdx: number | null;
  selectedType: "service" | "network" | "volume";
  selectedNetworkIdx: number | null;
  selectedVolumeIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  setSelectedType: (type: "service" | "network" | "volume") => void;
  setSelectedNetworkIdx: (idx: number | null) => void;
  setSelectedVolumeIdx: (idx: number | null) => void;
  selectService: (idx: number | null) => void;
  selectNetwork: (idx: number | null) => void;
  selectVolume: (idx: number | null) => void;
}

export function useSelectionState(): UseSelectionStateReturn {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [selectedType, setSelectedType] = useState<
    "service" | "network" | "volume"
  >("service");
  const [selectedNetworkIdx, setSelectedNetworkIdx] = useState<number | null>(
    null
  );
  const [selectedVolumeIdx, setSelectedVolumeIdx] = useState<number | null>(
    null
  );

  const selectService = useCallback((idx: number | null) => {
    setSelectedIdx(idx);
    setSelectedType("service");
    setSelectedNetworkIdx(null);
    setSelectedVolumeIdx(null);
  }, []);

  const selectNetwork = useCallback((idx: number | null) => {
    setSelectedNetworkIdx(idx);
    setSelectedType("network");
    setSelectedIdx(null);
    setSelectedVolumeIdx(null);
  }, []);

  const selectVolume = useCallback((idx: number | null) => {
    setSelectedVolumeIdx(idx);
    setSelectedType("volume");
    setSelectedIdx(null);
    setSelectedNetworkIdx(null);
  }, []);

  return {
    selectedIdx,
    selectedType,
    selectedNetworkIdx,
    selectedVolumeIdx,
    setSelectedIdx,
    setSelectedType,
    setSelectedNetworkIdx,
    setSelectedVolumeIdx,
    selectService,
    selectNetwork,
    selectVolume,
  };
}

