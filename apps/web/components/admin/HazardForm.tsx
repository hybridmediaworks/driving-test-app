"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { AdminHazard, HazardType } from "@driving-test-app/shared";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

const SELECT_CLASS = "h-9 rounded-md border border-input bg-background px-3 text-sm";

const TYPE_OPTIONS: { value: HazardType; label: string }[] = [
  { value: "vehicle", label: "Vehicle" },
  { value: "pedestrian", label: "Pedestrian" },
  { value: "sign", label: "Sign" },
  { value: "signal", label: "Signal" },
  { value: "road_mark", label: "Road marking" },
];

type Props =
  | { mode: "create"; simulatorId: string; hazard?: undefined }
  | { mode: "edit"; simulatorId: string; hazard: AdminHazard };

/**
 * Create / edit form for one hazard. Shared by .../hazards/create and .../hazards/[hazardId]/edit.
 * The highlight box is optional — leaving it off stores null, and the player falls back to a
 * category-based marker zone.
 */
export default function HazardForm({ mode, simulatorId, hazard }: Props) {
  const router = useRouter();

  const [type, setType] = useState<HazardType>(hazard?.type ?? "vehicle");
  const [hazardMode, setHazardMode] = useState<"demo" | "assessment">(hazard?.mode ?? "assessment");
  const [inTimeline, setInTimeline] = useState(hazard?.in_timeline ?? true);
  const [timeStart, setTimeStart] = useState(hazard ? String(hazard.time_start) : "");
  const [timeEnd, setTimeEnd] = useState(hazard ? String(hazard.time_end) : "");
  const [frameCount, setFrameCount] = useState(hazard ? String(hazard.frame_count) : "0");
  const [comment, setComment] = useState(hazard?.comment ?? "");
  const [audioUrl, setAudioUrl] = useState(hazard?.audio_url ?? "");

  const [hasBox, setHasBox] = useState(hazard?.box != null);
  const [box, setBox] = useState({
    x: String(hazard?.box?.x ?? 0.4),
    y: String(hazard?.box?.y ?? 0.4),
    w: String(hazard?.box?.w ?? 0.2),
    h: String(hazard?.box?.h ?? 0.2),
  });

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const listHref = `/admin/hazard-simulators/${simulatorId}/hazards`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const form = new FormData();
    if (mode === "edit") form.append("_method", "PUT");
    form.append("type", type);
    form.append("mode", hazardMode);
    form.append("in_timeline", inTimeline ? "1" : "0");
    form.append("time_start", timeStart);
    form.append("time_end", timeEnd);
    form.append("frame_count", frameCount || "0");
    form.append("comment", comment);
    form.append("audio_url", audioUrl);
    if (hasBox) {
      form.append("box[x]", box.x);
      form.append("box[y]", box.y);
      form.append("box[w]", box.w);
      form.append("box[h]", box.h);
    }

    try {
      const path =
        mode === "edit"
          ? `/admin/hazard-simulators/${simulatorId}/hazards/${hazard.id}`
          : `/admin/hazard-simulators/${simulatorId}/hazards`;
      await api.post(path, form);
      router.push(listHref);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form className="w-full max-w-2xl space-y-6" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="type" className="gap-1">
            Category <span className="text-destructive">*</span>
          </Label>
          <select
            id="type"
            className={SELECT_CLASS}
            value={type}
            onChange={(e) => setType(e.target.value as HazardType)}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <InputError message={errors.type?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mode" className="gap-1">
            Phase <span className="text-destructive">*</span>
          </Label>
          <select
            id="mode"
            className={SELECT_CLASS}
            value={hazardMode}
            onChange={(e) => setHazardMode(e.target.value as "demo" | "assessment")}
          >
            <option value="assessment">Scored round</option>
            <option value="demo">Tutorial walkthrough</option>
          </select>
          <InputError message={errors.mode?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="in_timeline" className="gap-1">
            Counts toward the score <span className="text-destructive">*</span>
          </Label>
          <select
            id="in_timeline"
            className={SELECT_CLASS}
            value={inTimeline ? "true" : "false"}
            onChange={(e) => setInTimeline(e.target.value === "true")}
          >
            <option value="true">Scored (in the timeline)</option>
            <option value="false">Practice pool only</option>
          </select>
          <InputError message={errors.in_timeline?.[0]} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="time_start" className="gap-1">
            Window start (s) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time_start"
            type="number"
            step="0.001"
            min={0}
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
          />
          <InputError message={errors.time_start?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="time_end" className="gap-1">
            Window end (s) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time_end"
            type="number"
            step="0.001"
            min={0}
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
          />
          <InputError message={errors.time_end?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="frame_count">Keyframe count</Label>
          <Input
            id="frame_count"
            type="number"
            min={0}
            value={frameCount}
            onChange={(e) => setFrameCount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Informational only — from the source crawl.</p>
          <InputError message={errors.frame_count?.[0]} />
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-border p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={hasBox} onChange={(e) => setHasBox(e.target.checked)} />
          Set a highlight box
        </label>
        <p className="text-xs text-muted-foreground">
          Normalised 0–1 from the top-left of the video. Off = the player draws a generic marker zone for this category.
        </p>
        {hasBox && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["x", "y", "w", "h"] as const).map((k) => (
              <div key={k} className="grid gap-1.5">
                <Label htmlFor={`box_${k}`} className="uppercase">
                  {k}
                </Label>
                <Input
                  id={`box_${k}`}
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={box[k]}
                  onChange={(e) => setBox((prev) => ({ ...prev, [k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}
        <InputError message={errors.box?.[0] ?? errors["box.x"]?.[0] ?? errors["box.w"]?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="comment">Feedback message</Label>
        <Textarea
          id="comment"
          rows={3}
          maxLength={2000}
          placeholder="Shown on the pause-and-explain card when this hazard is spotted."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <InputError message={errors.comment?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="audio_url">Narration MP3 URL</Label>
        <Input
          id="audio_url"
          type="url"
          placeholder="https://…"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
        />
        <InputError message={errors.audio_url?.[0]} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={processing}>
          {mode === "edit" ? "Save" : "Add hazard"}
        </Button>
        <Button variant="outline" type="button" render={<Link href={listHref} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
