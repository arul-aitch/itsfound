import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    throw new Error("Supabase URL/ANON_KEY tidak diset");
}

export const supabase = createClient(url, anonKey);

const BUCKET = "itsfound-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadPhoto(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) {
        throw new Error("File harus berupa gambar");
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("Ukuran file maksimal 5MB");
    }

    const originalName = file.name;
    const lastDotIndex = originalName.lastIndexOf(".");
    const ext =
        lastDotIndex > -1 && lastDotIndex < originalName.length - 1
            ? originalName.slice(lastDotIndex + 1).toLowerCase()
            : "jpg";

    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const path = `reports/${filename}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
    });

    if (error) {
        throw new Error(error.message);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return data.publicUrl;
}
