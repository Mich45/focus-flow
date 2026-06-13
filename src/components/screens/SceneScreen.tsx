import { useRef, type ChangeEvent, type CSSProperties } from "react";
import { Check, Upload, X, Image as ImageIcon } from "lucide-react";
import { GRADIENTS } from "../../lib/backgrounds";
import { useAppearance } from "../../stores/appearanceStore";
import { Slider } from "../ui/Slider";

/** Full-screen background picker + dim/blur (FR-B1–B4). */
export function SceneScreen() {
  const a = useAppearance();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void a.addUserImage(f);
    e.target.value = "";
  };

  const tile = (selected: boolean): CSSProperties => ({
    aspectRatio: "16 / 10",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    border: selected ? "2.5px solid var(--accent)" : "2.5px solid transparent",
    boxShadow: selected ? "var(--shadow-8)" : "var(--shadow-2)",
    transition: "all .18s var(--ease-std)",
  });

  const Badge = () => (
    <span
      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full"
      style={{ background: "var(--accent)", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}
    >
      <Check size={14} strokeWidth={2.6} />
    </span>
  );
  const Caption = ({ name }: { name: string }) => (
    <>
      <span className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 50%,rgba(0,0,0,.5))" }} />
      <span className="absolute bottom-2 left-3 text-[12.5px] font-semibold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>
        {name}
      </span>
    </>
  );

  return (
    <div className="sheet fade-up">
      <div className="sheet-head">
        <div>
          <h1 className="sheet-title">Backgrounds</h1>
          <div className="sheet-sub">Set the scene for your focus sessions</div>
        </div>
      </div>
      <div className="sheet-body">
        <div className="grid grid-cols-3 gap-3.5">
          {GRADIENTS.map((g) => {
            const on = a.backgroundId === g.id;
            return (
              <button key={g.id} style={{ ...tile(on), background: g.css }} onClick={() => a.setBackground(g.id)}>
                <Caption name={g.name} />
                {on && <Badge />}
              </button>
            );
          })}

          {/* solid / minimal */}
          <button style={{ ...tile(a.backgroundId === "solid"), background: a.solidColor }} onClick={() => a.setBackground("solid")}>
            <Caption name="Solid color" />
            {a.backgroundId === "solid" && <Badge />}
          </button>

          {/* user images */}
          {a.userImages.map((img) => {
            const on = a.backgroundId === `user:${img.id}`;
            return (
              <div key={img.id} className="group" style={{ ...tile(on), backgroundImage: `url("${img.src}")`, backgroundSize: "cover", backgroundPosition: "center" }}>
                <button className="absolute inset-0" onClick={() => a.setBackground(`user:${img.id}`)} aria-label={img.name} />
                <Caption name={img.name} />
                {on && <Badge />}
                <button
                  className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full group-hover:flex"
                  style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}
                  onClick={() => void a.removeImage(img)}
                  title="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}

          {/* upload */}
          <button
            className="flex flex-col items-center justify-center gap-2"
            style={{ aspectRatio: "16 / 10", borderRadius: 12, border: "2px dashed var(--ui-border-2)", background: "var(--ui-sunken)", color: "var(--ui-text-2)" }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={22} />
            <span className="text-[12.5px] font-semibold">Upload your own</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          </button>
        </div>

        <div className="mt-5 grid max-w-[420px] gap-4">
          <Slider label="Dim" value={a.dimPct} min={0} max={80} suffix="%" onChange={a.setDim} />
          <Slider label="Blur" value={a.blurPx} min={0} max={20} suffix="px" onChange={a.setBlur} />
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-[10px] p-3.5" style={{ background: "var(--green-tint)", color: "var(--green-primary)" }}>
          <ImageIcon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span className="text-[12.5px] leading-relaxed">
            Backgrounds sit behind the timer. Dim and blur keep the clock readable over any image.
          </span>
        </div>
      </div>
    </div>
  );
}
