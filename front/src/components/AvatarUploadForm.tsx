"use client";

import { useActionState, useRef, useState } from "react";
import { updateAvatarAction, removeAvatarAction, type FormState } from "@/app/actions/avatar";
import { Avatar } from "@/components/Avatar";
import { SubmitButton } from "@/components/SubmitButton";
import { errorClass } from "@/lib/ui";

export function AvatarUploadForm({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    updateAvatarAction,
    undefined
  );
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar src={preview ?? avatarUrl} name={name} size={80} />
        <div className="flex flex-col gap-2">
          <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
              className="text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground hover:file:bg-accent-soft/70"
            />
            <SubmitButton>Загрузить</SubmitButton>
          </form>
          {avatarUrl && (
            <form action={removeAvatarAction}>
              <button
                type="submit"
                className="text-sm text-muted hover:text-danger"
              >
                Удалить аватар
              </button>
            </form>
          )}
        </div>
      </div>
      {state?.error && <p className={errorClass}>{state.error}</p>}
      <p className="text-xs text-muted">JPEG, PNG или WebP, до 3 МБ.</p>
    </div>
  );
}
