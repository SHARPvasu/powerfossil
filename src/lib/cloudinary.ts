// This utility simulates a Cloudinary upload while the API keys are not configured.
// Once actual Cloudinary keys are supplied, this file can be replaced with the exact v2.uploader logic.
// For now, it accepts a base64 string and returns it safely to be stored in the database if it is small enough,
// or returns a placeholder image URL for massive files so we don't break the SQLite fallback limits.

export async function uploadImage(base64Data: string, folder: string): Promise<string> {
    try {
        // In a real scenario:
        // import { v2 as cloudinary } from 'cloudinary'
        // const result = await cloudinary.uploader.upload(base64Data, { folder })
        // return result.secure_url

        console.log(`[Cloudinary Mock] Uploading file to folder: ${folder}`)

        // If the base64 string is extremely long (over ~1MB), SQLite might struggle depending on the chunk size.
        // We'll mimic an upload by just storing the data string itself if it's reasonable,
        // otherwise returning a reliable placeholder from unsplash/placeholder services to prevent DB crashes during this Phase.

        if (base64Data.length > 1500000) {
            console.warn(`[Cloudinary Mock] File too large for local DB mock storage. Returning placeholder.`)
            return `https://placehold.co/600x400/10b981/ffffff?text=Document+Uploaded+Secured\n(Mock+Cloudinary)`
        }

        return base64Data

    } catch (error) {
        console.error("Mock upload failed", error)
        throw new Error("Failed to upload image")
    }
}
