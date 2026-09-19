"use client";

import * as React from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/storage";
import { upsertDoctorAction, toggleDoctorActiveAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Stethoscope,
  PlusCircle,
  Edit2,
  CheckCircle,
  XCircle,
  Upload,
  Loader2,
  Languages,
} from "lucide-react";

export interface DoctorAdminRecord {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  bio: string;
  languages: string[];
  consultationFee: number;
  photoPath: string;
  isActive: boolean;
  displayOrder: number;
}

interface DoctorsManagerProps {
  initialDoctors: DoctorAdminRecord[];
}

export function DoctorsManager({ initialDoctors }: DoctorsManagerProps) {
  const [doctors, setDoctors] = React.useState<DoctorAdminRecord[]>(initialDoctors);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingDoctor, setEditingDoctor] = React.useState<DoctorAdminRecord | null>(null);

  // Form Fields
  const [fullName, setFullName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [specialty, setSpecialty] = React.useState("");
  const [qualifications, setQualifications] = React.useState("");
  const [experienceYears, setExperienceYears] = React.useState("10");
  const [consultationFee, setConsultationFee] = React.useState("800");
  const [languagesStr, setLanguagesStr] = React.useState("English, Telugu, Hindi");
  const [bio, setBio] = React.useState("");
  const [photoPath, setPhotoPath] = React.useState("/images/placeholder-doctor.svg");

  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function openCreateModal() {
    setEditingDoctor(null);
    setFullName("");
    setSlug("");
    setSpecialty("General Medicine");
    setQualifications("MBBS, MD");
    setExperienceYears("10");
    setConsultationFee("800");
    setLanguagesStr("English, Telugu, Hindi");
    setBio("");
    setPhotoPath("/images/placeholder-doctor.svg");
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(doc: DoctorAdminRecord) {
    setEditingDoctor(doc);
    setFullName(doc.fullName);
    setSlug(doc.slug);
    setSpecialty(doc.specialty);
    setQualifications(doc.qualifications);
    setExperienceYears(String(doc.experienceYears));
    setConsultationFee(String(doc.consultationFee));
    setLanguagesStr(doc.languages.join(", "));
    setBio(doc.bio);
    setPhotoPath(doc.photoPath);
    setError(null);
    setModalOpen(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "doctors");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.path) {
        setPhotoPath(data.path);
      } else {
        setError(data.error || "Failed to upload image.");
      }
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDoctor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const languages = languagesStr
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    const res = await upsertDoctorAction({
      id: editingDoctor ? editingDoctor.id : undefined,
      slug: slug || fullName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      fullName,
      specialty,
      qualifications,
      experienceYears: parseInt(experienceYears, 10),
      consultationFee: parseInt(consultationFee, 10),
      languages,
      bio,
      photoPath,
      isActive: editingDoctor ? editingDoctor.isActive : true,
    });

    setSaving(false);

    if (res.success && res.doctor) {
      if (editingDoctor) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === res.doctor!.id ? (res.doctor as any) : d))
        );
      } else {
        setDoctors((prev) => [...prev, res.doctor as any]);
      }
      setModalOpen(false);
    } else {
      setError("Failed to save doctor.");
    }
  }

  async function handleToggleActive(docId: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    await toggleDoctorActiveAction(docId, newStatus);
    setDoctors((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isActive: newStatus } : d))
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
            Doctors & Specialties
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage clinic specialists, fees, qualifications, and profile photos.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          size="sm"
          className="rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Add New Specialist</span>
        </Button>
      </div>

      {/* Grid of Doctors */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className={`rounded-2xl border p-5 bg-card shadow-xs transition-all flex flex-col justify-between ${
              doc.isActive ? "border-border/80" : "opacity-60 border-dashed"
            }`}
          >
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted/60 border">
                  <Image
                    src={getImageUrl(doc.photoPath)}
                    alt={doc.fullName}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Badge variant={doc.isActive ? "default" : "outline"} className="text-[10px]">
                      {doc.specialty}
                    </Badge>
                    <span className="text-xs font-bold text-foreground">
                      ₹{doc.consultationFee}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground truncate mt-1">
                    {doc.fullName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{doc.qualifications}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {doc.bio}
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Languages className="h-3.5 w-3.5" />
                <span className="truncate">{doc.languages.join(", ")}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleActive(doc.id, doc.isActive)}
                className="text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                {doc.isActive ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Inactive</span>
                  </>
                )}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(doc)}
                className="rounded-lg text-xs h-8"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                <span>Edit</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Doctor Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingDoctor ? "Edit Specialist Profile" : "Add New Medical Specialist"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSaveDoctor} className="space-y-4 py-2 text-xs">
          {error && <p className="text-destructive font-semibold text-xs">{error}</p>}

          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted/60 border">
              <Image
                src={getImageUrl(photoPath)}
                alt="Doctor Preview"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold block mb-1">Doctor Photo</Label>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-muted">
                <Upload className="h-3.5 w-3.5" />
                <span>{uploading ? "Uploading..." : "Upload New Photo"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold">Doctor Full Name *</Label>
              <Input
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (!editingDoctor) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }
                }}
                placeholder="Dr. Full Name"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">URL Slug *</Label>
              <Input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="dr-example-name"
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold">Specialty *</Label>
              <Input
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiology"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Qualifications *</Label>
              <Input
                required
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="MBBS, MD, DM"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold">Experience (Years) *</Label>
              <Input
                type="number"
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Consultation Fee (₹ INR) *</Label>
              <Input
                type="number"
                required
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Languages Spoken (comma separated)</Label>
            <Input
              value={languagesStr}
              onChange={(e) => setLanguagesStr(e.target.value)}
              placeholder="English, Telugu, Hindi"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Doctor Bio / Profile</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Clinical experience, academic background..."
              className="mt-1 text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Specialist"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
