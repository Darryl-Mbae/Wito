import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import app from "../config/firebase";

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string;
const db = getFirestore(app);

export type OrgAsset = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  createdBy?: string;
};

function assetsCol(orgId: string) {
  return collection(db, "organizations", orgId, "assets");
}

/** Upload an image to R2 via the Cloudflare worker. Returns the public URL. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!WORKER_URL) throw new Error("Upload worker is not configured");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  if (file.size > 10 * 1024 * 1024) throw new Error("File too large (max 10MB)");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch(`${WORKER_URL}/upload`, { method: "POST", body: fd });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Upload failed");
  }

  const { url } = (await res.json()) as { url: string };
  return url;
}

export async function listOrgAssets(orgId: string): Promise<OrgAsset[]> {
  const snap = await getDocs(query(assetsCol(orgId), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? "Untitled",
      url: data.url,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  });
}

export async function createOrgAsset(
  orgId: string,
  uid: string,
  data: { name: string; url: string }
): Promise<OrgAsset> {
  const ref = await addDoc(assetsCol(orgId), {
    name: data.name,
    url: data.url,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    name: data.name,
    url: data.url,
    createdBy: uid,
    createdAt: new Date().toISOString(),
  };
}

export async function deleteOrgAsset(orgId: string, assetId: string): Promise<void> {
  await deleteDoc(doc(db, "organizations", orgId, "assets", assetId));
}

/** Upload to R2 and save metadata under the org's assets library. */
export async function uploadOrgAsset(
  orgId: string,
  uid: string,
  file: File,
  name?: string
): Promise<OrgAsset> {
  const url = await uploadImage(file, `orgs/${orgId}/library`);
  const assetName = name?.trim() || file.name.replace(/\.[^.]+$/, "") || "Photo";
  return createOrgAsset(orgId, uid, { name: assetName, url });
}

const IMAGE_KEY_RE = /(image|photo|logo|avatar|thumbnail|cover|banner|pic|picture|poster)/i;

/** Detect whether a template JSON field should use the image picker. */
export function isImageField(
  key: string,
  value?: unknown,
  varType?: string
): boolean {
  if (varType === "image") return true;
  if (IMAGE_KEY_RE.test(key)) return true;
  if (typeof value === "string" && /\.(jpe?g|png|gif|webp|svg)(\?|#|$)/i.test(value)) {
    return true;
  }
  return false;
}
