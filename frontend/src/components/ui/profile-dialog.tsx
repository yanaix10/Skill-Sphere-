"use client";

import { useCharacterLimit } from "@/components/ui/dialog-utils/use-character-limit";
import { useImageUpload } from "@/components/ui/dialog-utils/use-image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ImagePlus, X } from "lucide-react";
import { useId, useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { compressImage } from "@/lib/image-utils";

export interface ProfileDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSaved?: () => void;
}

export function ProfileDialog({
  open,
  onOpenChange,
  trigger,
  onSaved,
}: ProfileDialogProps) {
  const id = useId();

  const [firstName, setFirstName] = useState("Naitik");
  const [lastName, setLastName] = useState("Yadav");
  const [username, setUsername] = useState("naitik_dev");
  const [website, setWebsite] = useState("www.skillsphere.dev");
  const [collegeName, setCollegeName] = useState("VIT Chennai");
  const [degree, setDegree] = useState("B.Tech");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("3");
  const [age, setAge] = useState("21");
  const [homeCity, setHomeCity] = useState("Bangalore");
  const [bannerImage, setBannerImage] = useState<string | null>(
    "https://cdn.21st.dev/assets/localized/feb98d05c4c252d9b9bb86b4cf80d14b38e69ea16b404e219f36a53f252b1f1c.jpg"
  );
  const [avatarImage, setAvatarImage] = useState<string | null>(
    "https://cdn.21st.dev/assets/localized/8d83e28e14ccb2140152662c91092e7696fada2802b4e1bb82d1d363f6723ed4.jpg"
  );
  const [isSaving, setIsSaving] = useState(false);

  const maxLength = 180;
  const {
    value: bio,
    setValue: setBio,
    characterCount,
    handleChange: handleBioChange,
    maxLength: limit,
  } = useCharacterLimit({
    maxLength,
    initialValue:
      "Passionate developer & competitive programmer on SkillSphere.",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      if (user.uid === "test-user-123") {
        const local = localStorage.getItem("skillsphere_dev_profile");
        if (local) {
          try {
            const data = JSON.parse(local);
            const parts = (data.name || "Naitik Yadav").split(" ");
            setFirstName(parts[0] || "");
            setLastName(parts.slice(1).join(" ") || "");
            setUsername(data.username || "naitik_dev");
            setWebsite(data.website || "www.skillsphere.dev");
            setCollegeName(data.collegeName || "VIT Chennai");
            setDegree(data.degree || "B.Tech");
            setBranch(data.branch || "CSE");
            setYear(data.year || "3");
            setAge(data.age || "21");
            setHomeCity(data.homeCity || "Bangalore");
            if (data.about) setBio(data.about);
            if (data.bannerUrl) setBannerImage(data.bannerUrl);
            if (data.avatarUrl) setAvatarImage(data.avatarUrl);
          } catch (e) {}
        }
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const parts = (data.name || "").split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
          setUsername(data.username || "");
          setWebsite(data.website || "");
          setCollegeName(data.collegeName || "");
          setDegree(data.degree || "");
          setBranch(data.branch || "");
          setYear(data.year || "");
          setAge(data.age || "");
          setHomeCity(data.homeCity || "");
          if (data.about) setBio(data.about);
          if (data.bannerUrl) setBannerImage(data.bannerUrl);
          if (data.avatarUrl) setAvatarImage(data.avatarUrl);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };
    fetchUser();
  }, [open]);

  const handleSave = async () => {
    const user = auth.currentUser;
    const profilePayload = {
      name: `${firstName} ${lastName}`.trim(),
      username,
      website,
      collegeName,
      degree,
      branch,
      year,
      age,
      homeCity,
      about: bio,
      bannerUrl: bannerImage,
      avatarUrl: avatarImage,
    };

    setIsSaving(true);
    try {
      if (user) {
        if (user.uid === "test-user-123") {
          localStorage.setItem(
            "skillsphere_dev_profile",
            JSON.stringify(profilePayload)
          );
        } else {
          await setDoc(doc(db, "users", user.uid), profilePayload, {
            merge: true,
          });
          try {
            await updateProfile(user, {
              displayName: profilePayload.name,
              photoURL: avatarImage || undefined,
            });
          } catch (authErr) {
            console.warn("Could not update auth profile photo:", authErr);
          }
        }
      }

      // Broadcast profile change so UI components update live
      window.dispatchEvent(
        new CustomEvent("profile-updated", { detail: profilePayload })
      );

      if (onSaved) onSaved();
      if (onOpenChange) onOpenChange(false);
    } catch (e) {
      console.error("Error saving profile:", e);
      alert("Failed to save profile. Please check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && open === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline">Edit profile</Button>
        </DialogTrigger>
      )}
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5 bg-card text-foreground border-border max-h-[90vh]">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-border px-6 py-4 text-base">
            Edit profile
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Make changes to your profile here. You can change your photo and set a
          username.
        </DialogDescription>
        <div className="overflow-y-auto">
          <ProfileBg
            defaultImage={bannerImage || undefined}
            onImageChange={(img) => setBannerImage(img)}
          />
          <Avatar
            defaultImage={avatarImage || undefined}
            onImageChange={(img) => setAvatarImage(img)}
          />
          <div className="px-6 pb-6 pt-4">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-first-name`}>First name</Label>
                  <Input
                    id={`${id}-first-name`}
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    type="text"
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-last-name`}>Last name</Label>
                  <Input
                    id={`${id}-last-name`}
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    type="text"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-username`}>Username</Label>
                <div className="relative">
                  <Input
                    id={`${id}-username`}
                    className="peer pe-9"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="text-emerald-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-website`}>Website</Label>
                <div className="flex rounded-lg shadow-sm shadow-black/5">
                  <span className="-z-10 inline-flex items-center rounded-s-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-400">
                    https://
                  </span>
                  <Input
                    id={`${id}-website`}
                    className="-ms-px rounded-s-none shadow-none"
                    placeholder="yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    type="text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${id}-college`}>College / University</Label>
                  <Input
                    id={`${id}-college`}
                    placeholder="e.g. VIT Chennai"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-degree`}>Degree & Branch</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${id}-degree`}
                      placeholder="Degree"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-1/2"
                      type="text"
                    />
                    <Input
                      id={`${id}-branch`}
                      placeholder="Branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-1/2"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${id}-year`}>Year of Study</Label>
                  <Input
                    id={`${id}-year`}
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-age`}>Age</Label>
                  <Input
                    id={`${id}-age`}
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-city`}>Home City</Label>
                  <Input
                    id={`${id}-city`}
                    placeholder="City"
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-bio`}>Biography</Label>
                <Textarea
                  id={`${id}-bio`}
                  placeholder="Write a few sentences about yourself"
                  value={bio}
                  maxLength={maxLength}
                  onChange={handleBioChange}
                  aria-describedby={`${id}-description`}
                />
                <p
                  id={`${id}-description`}
                  className="mt-2 text-right text-xs text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  <span className="tabular-nums">{limit - characterCount}</span>{" "}
                  characters left
                </p>
              </div>
            </form>
          </div>
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileBg({
  defaultImage,
  onImageChange,
}: {
  defaultImage?: string;
  onImageChange?: (url: string | null) => void;
}) {
  const [hideDefault, setHideDefault] = useState(false);
  const {
    previewUrl,
    setPreviewUrl,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload();

  const currentImage = previewUrl || (!hideDefault ? defaultImage : null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e);
    const file = e.target.files?.[0];
    if (file && onImageChange) {
      try {
        // Compress banner to max 900x320 at 0.75 quality (keeps size ~40-60KB)
        const compressed = await compressImage(file, 900, 320, 0.75);
        setPreviewUrl(compressed);
        onImageChange(compressed);
      } catch (err) {
        console.warn("Banner compression failed, falling back to FileReader:", err);
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
          onImageChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleImageRemove = () => {
    handleRemove();
    setHideDefault(true);
    if (onImageChange) onImageChange(null);
  };

  return (
    <div className="h-32">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-secondary">
        {currentImage && (
          <img
            className="h-full w-full object-cover"
            src={currentImage}
            alt={
              previewUrl
                ? "Preview of uploaded image"
                : "Default profile background"
            }
            width={512}
            height={96}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <button
            type="button"
            className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
            onClick={handleThumbnailClick}
            aria-label={currentImage ? "Change image" : "Upload image"}
          >
            <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          {currentImage && (
            <button
              type="button"
              className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
              onClick={handleImageRemove}
              aria-label="Remove image"
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFile}
        className="hidden"
        accept="image/*"
        aria-label="Upload image file"
      />
    </div>
  );
}

function Avatar({
  defaultImage,
  onImageChange,
}: {
  defaultImage?: string;
  onImageChange?: (url: string | null) => void;
}) {
  const {
    previewUrl,
    setPreviewUrl,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
  } = useImageUpload();

  const currentImage = previewUrl || defaultImage;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e);
    const file = e.target.files?.[0];
    if (file && onImageChange) {
      try {
        // Compress avatar to max 300x300 at 0.8 quality (keeps size ~20-35KB)
        const compressed = await compressImage(file, 300, 300, 0.8);
        setPreviewUrl(compressed);
        onImageChange(compressed);
      } catch (err) {
        console.warn("Avatar compression failed, falling back to FileReader:", err);
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
          onImageChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="-mt-10 px-6">
      <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-secondary shadow-sm shadow-black/10">
        {currentImage && (
          <img
            src={currentImage}
            className="h-full w-full object-cover"
            width={80}
            height={80}
            alt="Profile image"
          />
        )}
        <button
          type="button"
          className="absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
          onClick={handleThumbnailClick}
          aria-label="Change profile picture"
        >
          <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFile}
          className="hidden"
          accept="image/*"
          aria-label="Upload profile picture"
        />
      </div>
    </div>
  );
}

export { ProfileBg, Avatar };
export default ProfileDialog;
