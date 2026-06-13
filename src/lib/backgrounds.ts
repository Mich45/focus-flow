/** Bundled wallpaper gradients (FR-B1). Code-defined, so zero bundle weight. */

export interface Gradient {
  id: string;
  name: string;
  css: string;
}

export const GRADIENTS: Gradient[] = [
  {
    id: "forest",
    name: "Forest Mist",
    css:
      "radial-gradient(120% 85% at 18% 0%,#3a8b6c 0%,transparent 55%)," +
      "radial-gradient(110% 90% at 92% 28%,#1f5d44 0%,transparent 50%)," +
      "linear-gradient(165deg,#173f2f 0%,#08190f 100%)",
  },
  {
    id: "dawn",
    name: "Dawn Haze",
    css:
      "radial-gradient(100% 80% at 82% 8%,#ffd6a0 0%,transparent 52%)," +
      "radial-gradient(120% 95% at 8% 34%,#f29a8e 0%,transparent 50%)," +
      "linear-gradient(165deg,#9a5a7a 0%,#2c2b54 100%)",
  },
  {
    id: "dusk",
    name: "Dusk",
    css:
      "radial-gradient(110% 80% at 76% 12%,#c79be0 0%,transparent 50%)," +
      "radial-gradient(120% 92% at 14% 42%,#6f6fd6 0%,transparent 50%)," +
      "linear-gradient(160deg,#322c63 0%,#10112c 100%)",
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    css:
      "radial-gradient(110% 80% at 24% 8%,#67c3d6 0%,transparent 50%)," +
      "radial-gradient(120% 92% at 86% 40%,#2c79ac 0%,transparent 50%)," +
      "linear-gradient(165deg,#10405f 0%,#061a30 100%)",
  },
  {
    id: "aurora",
    name: "Aurora",
    css:
      "radial-gradient(90% 70% at 20% 10%,#46e0a8 0%,transparent 50%)," +
      "radial-gradient(90% 70% at 80% 20%,#7a6bff 0%,transparent 52%)," +
      "radial-gradient(120% 90% at 50% 90%,#1f8a8a 0%,transparent 55%)," +
      "linear-gradient(165deg,#102a2e 0%,#0a1322 100%)",
  },
  {
    id: "graphite",
    name: "Graphite",
    css:
      "radial-gradient(100% 80% at 30% 8%,#3c4554 0%,transparent 55%)," +
      "radial-gradient(90% 70% at 85% 30%,#4a5568 0%,transparent 50%)," +
      "linear-gradient(165deg,#262d39 0%,#0f131a 100%)",
  },
];

export const DEFAULT_BACKGROUND_ID = "forest";

export function gradientById(id: string): Gradient | undefined {
  return GRADIENTS.find((g) => g.id === id);
}
