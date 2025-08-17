// src/components/BookForm.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  subscriptionTier: string;
  thumbnail: string;
  summary: string;
  previewPages: number;
  status: "published" | "draft";
  bookUrl?: string; // public URL to the book's file or index.html
}

interface BookFormProps {
  book?: Book | null;
  onSubmit: (bookData: Partial<Book>) => void;
}

function makeSafeFilename(name: string) {
  return name.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-\.]/g, "");
}

export const BookForm = ({ book, onSubmit }: BookFormProps) => {
  const [formData, setFormData] = useState({
    title: book?.title || "",
    author: book?.author || "Dr. Smith",
    category: book?.category || "",
    price: book?.price || 0,
    subscriptionTier: book?.subscriptionTier || "Basic",
    summary: book?.summary || "",
    previewPages: book?.previewPages || 3,
    status: book?.status || "draft",
    thumbnail: book?.thumbnail || "",
    bookFile: null as File | null,
    thumbnailFile: null as File | null,

    // ✅ NEW: allow pasting an existing Supabase Storage public URL (to index.html, pdf, etc.)
    manualStorageUrl: book?.bookUrl || "",
  });
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categories = [
    "Cardiology",
    "Emergency Medicine",
    "Surgery",
    "Pediatrics",
    "Neurology",
    "Radiology",
    "Internal Medicine",
    "Gynecology",
    "Dermatology",
    "Psychiatry",
  ];
  const subscriptionTiers = ["Basic", "Standard", "Premium"];
  const statusOptions = ["draft", "published"];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: "bookFile" | "thumbnailFile", file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      // 1) Upload thumbnail if provided
      let thumbnailUrl = formData.thumbnail;
      if (formData.thumbnailFile) {
        const safeThumbName = `${Date.now()}_${makeSafeFilename(
          formData.thumbnailFile.name
        )}`;
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(safeThumbName, formData.thumbnailFile, {
            cacheControl: "3600",
            upsert: false,
          });
        if (thumbError) throw thumbError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("thumbnails").getPublicUrl(thumbData.path);
        thumbnailUrl = publicUrl;
      }

      // 2) Determine book id
      const bookId = book?.id || uuidv4();

      // 3) Decide bookUrl:
      //    - If admin pasted a Supabase public URL -> use it
      //    - Else if a file was uploaded -> upload & use its public URL
      //    - Else keep existing (when editing)
      let bookUrl = book?.bookUrl || "";
      const pasted = (formData.manualStorageUrl || "").trim();

      if (pasted) {
        // Use the manually provided Storage public URL
        bookUrl = pasted;
      } else if (formData.bookFile) {
        // Upload the provided file to Storage
        const safeBookName = `${Date.now()}_${makeSafeFilename(formData.bookFile.name)}`;
        const path = `books/${bookId}/${safeBookName}`;
        const { data: bookData, error: bookError } = await supabase.storage
          .from("books")
          .upload(path, formData.bookFile, {
            cacheControl: "3600",
            upsert: true, // allow replacing if editing
          });
        if (bookError) throw bookError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("books").getPublicUrl(bookData.path);
        bookUrl = publicUrl;
      }

      const payload: Partial<Book> = {
        id: bookId,
        title: formData.title,
        author: formData.author,
        category: formData.category,
        price: Number(formData.price),
        subscriptionTier: formData.subscriptionTier,
        summary: formData.summary,
        previewPages: Number(formData.previewPages),
        status: formData.status as "published" | "draft",
        thumbnail: thumbnailUrl,
        bookUrl,
      };

      // 4) Persist to DB
let res;
if (book?.id) {
  // UPDATE
  res = await supabase
    .from("books")
    .update({
      title: payload.title,
      author: payload.author,
      category: payload.category,
      price: payload.price,
      subscription_tier: payload.subscriptionTier,
      summary: payload.summary,
      preview_pages: payload.previewPages,
      status: payload.status,
      thumbnail_url: payload.thumbnail,
      book_url: payload.bookUrl,
    })
    .eq("id", payload.id!); // ✅ no .select()
} else {
  // INSERT
   res = await supabase.from("books").insert({
  title: payload.title,
  author: payload.author,
  category: payload.category,
  price: payload.price,
  subscription_tier: payload.subscriptionTier,
  summary: payload.summary,
  preview_pages: payload.previewPages,
  status: payload.status,
  thumbnail_url: payload.thumbnail,
  book_url: payload.bookUrl,
  user_id: user.id,
});

}

      if (res.error) throw res.error;

      onSubmit(payload);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message.includes("upload")
          ? "Upload failed. Please try again."
          : err.message || "Save failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

      {/* Title & Author */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Book Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Enter book title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => handleInputChange("author", e.target.value)}
            placeholder="Author name"
            required
          />
        </div>
      </div>

      {/* Category & Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {[
                "Cardiology",
                "Emergency Medicine",
                "Surgery",
                "Pediatrics",
                "Neurology",
                "Radiology",
                "Internal Medicine",
                "Gynecology",
                "Dermatology",
                "Psychiatry",
              ].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (Kshs.)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Subscription Tier, Preview Pages, Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tier">Subscription Tier</Label>
          <Select
            value={formData.subscriptionTier}
            onValueChange={(v) => handleInputChange("subscriptionTier", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Basic", "Standard", "Premium"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="previewPages">Preview Pages</Label>
          <Input
            id="previewPages"
            type="number"
            value={formData.previewPages}
            onChange={(e) => handleInputChange("previewPages", e.target.value)}
            min={1}
            max={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => handleInputChange("status", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["draft", "published"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary">Book Summary</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => handleInputChange("summary", e.target.value)}
          placeholder="Enter a brief summary"
          rows={3}
          required
        />
      </div>

      {/* Uploads */}
      <div className="grid grid-cols-2 gap-4">
        {/* Thumbnail */}
        <div className="space-y-2">
          <Label>Thumbnail Image</Label>
          <div className="border-2 border-dashed rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("thumbnail-upload")?.click()}
                >
                  Choose Thumbnail
                </Button>
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange("thumbnailFile", e.target.files?.[0] || null)}
                />
              </div>
              {formData.thumbnailFile && (
                <p className="mt-2 text-sm">{formData.thumbnailFile.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Compressed Book (.zip) */}
        <div className="space-y-2">
          <Label>Compressed Book (.zip / .pdf)</Label>
          <div className="border-2 border-dashed rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("book-upload")?.click()}
                >
                  Upload File
                </Button>
                <input
                  id="book-upload"
                  type="file"
                  accept=".zip,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange("bookFile", e.target.files?.[0] || null)}
                />
              </div>
              {formData.bookFile && <p className="mt-2 text-sm">{formData.bookFile.name}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Manual Storage URL (alternative to uploading) */}
      <div className="space-y-2">
        <Label htmlFor="manualStorageUrl">Book Storage URL (Supabase)</Label>
        <Input
          id="manualStorageUrl"
          type="url"
          value={formData.manualStorageUrl}
          onChange={(e) => handleInputChange("manualStorageUrl", e.target.value)}
          placeholder="https://<your-project>.supabase.co/storage/v1/object/public/books/<bookId>/index.html"
        />
        <p className="text-xs text-muted-foreground">
          Paste the public URL of your book in Supabase Storage (e.g., an{" "}
          <code>index.html</code> or a PDF). If provided, this will be stored as the book link.
          Otherwise, the file you upload above will be used.
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" disabled={uploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : book ? "Update Book" : "Add Book"}
        </Button>
      </div>
    </form>
  );
};
