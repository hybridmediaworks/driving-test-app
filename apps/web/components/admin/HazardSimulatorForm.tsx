"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { AdminHazardSimulatorShowResponse } from "@driving-test-app/shared";
import { Button } from "@/components/ui/ShadcnButton";
import { Input } from "@/components/ui/Input";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import { api, ApiError } from "@/lib/api";

const SELECT_CLASS = "h-9 rounded-md border border-input bg-background px-3 text-sm";

/**
 * Edit form for a hazard simulator's staff-tunable settings. The catalog identity (title,
 * thumbnail, premium flag) lives on the underlying Video and is managed at /admin/videos.
 */
export default function HazardSimulatorForm({ data }: { data: AdminHazardSimulatorShowResponse }) {
  const router = useRouter();
  const sim = data.hazard_simulator;

  const [testLevel, setTestLevel] = useState(sim.test_level ?? "");
  const [testLocation, setTestLocation] = useState(sim.test_location ?? "");
  const [testNumber, setTestNumber] = useState(sim.test_number ?? "");
  const [passThreshold, setPassThreshold] = useState(
    sim.pass_threshold_percent != null ? String(sim.pass_threshold_percent) : "",
  );
  const [scoringProfile, setScoringProfile] = useState(sim.scoring_profile);
  const [isActive, setIsActive] = useState(sim.is_active);
  const [contentLocked, setContentLocked] = useState(sim.content_locked);

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const form = new FormData();
    form.append("_method", "PUT");
    form.append("test_level", testLevel);
    form.append("test_location", testLocation);
    form.append("test_number", testNumber);
    if (passThreshold.trim() !== "") form.append("pass_threshold_percent", passThreshold);
    form.append("scoring_profile", scoringProfile);
    form.append("is_active", isActive ? "1" : "0");
    form.append("content_locked", contentLocked ? "1" : "0");

    try {
      await api.post(`/admin/hazard-simulators/${sim.id}`, form);
      router.push("/admin/hazard-simulators");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form className="w-full max-w-2xl space-y-6" onSubmit={submit}>
      <dl className="grid gap-x-6 gap-y-1 rounded-md border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-muted-foreground">Title</dt>
          <dd className="font-medium">{sim.video?.title ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-mono text-xs">{sim.slug}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-muted-foreground">Hazards (scored / tutorial)</dt>
          <dd>
            {sim.hazard_count} / {sim.demo_hazard_count}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-muted-foreground">Vimeo id</dt>
          <dd className="font-mono text-xs">{sim.provider_video_id ?? "—"}</dd>
        </div>
      </dl>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="test_level">Difficulty</Label>
          <select
            id="test_level"
            className={SELECT_CLASS}
            value={testLevel}
            onChange={(e) => setTestLevel(e.target.value)}
          >
            <option value="">—</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <InputError message={errors.test_level?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="test_location">Filmed in</Label>
          <Input
            id="test_location"
            maxLength={120}
            value={testLocation}
            onChange={(e) => setTestLocation(e.target.value)}
          />
          <InputError message={errors.test_location?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="test_number">Test number</Label>
          <Input id="test_number" maxLength={20} value={testNumber} onChange={(e) => setTestNumber(e.target.value)} />
          <InputError message={errors.test_number?.[0]} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="pass_threshold_percent">Pass threshold (%)</Label>
          <Input
            id="pass_threshold_percent"
            type="number"
            min={1}
            max={100}
            placeholder="Blank = score only, no pass/fail"
            value={passThreshold}
            onChange={(e) => setPassThreshold(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            When set, the results screen shows a pass/fail label against this score.
          </p>
          <InputError message={errors.pass_threshold_percent?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="scoring_profile">Scoring profile</Label>
          <select
            id="scoring_profile"
            className={SELECT_CLASS}
            value={scoringProfile}
            onChange={(e) => setScoringProfile(e.target.value)}
          >
            {data.scoring_profiles.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Weights &amp; reaction bands are defined in config/hazard.php.</p>
          <InputError message={errors.scoring_profile?.[0]} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="is_active">Status</Label>
          <select
            id="is_active"
            className={SELECT_CLASS}
            value={isActive ? "true" : "false"}
            onChange={(e) => setIsActive(e.target.value === "true")}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <InputError message={errors.is_active?.[0]} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="content_locked">Content source</Label>
          <select
            id="content_locked"
            className={SELECT_CLASS}
            value={contentLocked ? "true" : "false"}
            onChange={(e) => setContentLocked(e.target.value === "true")}
          >
            <option value="false">Crawl-managed</option>
            <option value="true">Locked — staff-managed</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Locked simulators are skipped by the content importer, so manual hazard edits stay put.
          </p>
          <InputError message={errors.content_locked?.[0]} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={processing}>
          Save
        </Button>
        <Button variant="outline" type="button" render={<Link href="/admin/hazard-simulators" />}>
          Cancel
        </Button>
        <Button variant="secondary" type="button" render={<Link href={`/admin/hazard-simulators/${sim.id}/hazards`} />}>
          Edit hazards
        </Button>
      </div>
    </form>
  );
}
