"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";

const uploadSchema = z.object({
  file: z
    .any()
    .refine(
      (file) =>
        file?.[0] &&
        ["audio/webm", "audio/m4a", "video/webm", "video/mp4"].includes(
          file[0].type
        ),
      { message: "Please upload a valid .webm, .m4a, or .mp4 file" }
    ),
});

export default function UploadCard() {
  const [preview, setPreview] = useState(null);

  const form = useForm({
    resolver: zodResolver(uploadSchema),
  });

  const mutation = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append("file", data.file[0]);
    mutation.mutate(formData);

    // for local preview (audio/video tag)
    const file = data.file[0];
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  return (
    <Card className="max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Upload Interview Recording</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Upload File (.webm, .m4a, .mp4)</Label>
            <Input
              id="file"
              type="file"
              accept=".webm,.m4a,.mp4"
              {...form.register("file")}
            />
            {form.formState.errors.file && (
              <p className="text-sm text-red-500">
                {form.formState.errors.file.message}
              </p>
            )}
          </div>

          {preview && (
            <div className="mt-4 space-y-2">
              {preview.endsWith(".mp4") || preview.includes("video") ? (
                <video controls className="w-full rounded-lg">
                  <source src={preview} />
                </video>
              ) : (
                <audio controls className="w-full">
                  <source src={preview} />
                </audio>
              )}
            </div>
          )}

          <CardFooter className="p-0 pt-4">
            <Button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full"
            >
              {mutation.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
