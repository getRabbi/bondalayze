// src/autopost/lib/publishMeta.ts

type FbPhotoResponse = { id?: string };
type IgCreateResponse = { id?: string };
type IgPublishResponse = { id?: string };

async function fbGraph(
  path: string,
  accessToken: string,
  params: Record<string, string>
) {
  const url = new URL(`https://graph.facebook.com/v20.0/${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const resp = await fetch(url.toString(), { method: "POST" });
  const json = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(
      `FB Graph error (${resp.status}): ${json?.error?.message || "Unknown"}`
    );
  }
  return json;
}

export async function postToFacebook(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string
) {
  const url = new URL(`https://graph.facebook.com/v20.0/${pageId}/photos`);
  url.searchParams.set("url", imageUrl);           // must be public direct image
  url.searchParams.set("caption", caption);
  url.searchParams.set("published", "true");
  url.searchParams.set("access_token", pageAccessToken);

  const resp = await fetch(url.toString(), { method: "POST" });
  const json = await resp.json();

  if (!resp.ok) {
    throw new Error(`FB Graph error (${resp.status}): ${json?.error?.message || "Unknown"}`);
  }

  // ✅ FB photo upload returns { id: "....", post_id?: "...." }
  return json; // json.id is the photo id
}


async function igGraph(path: string, token: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/v20.0/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);

  const resp = await fetch(url.toString(), { method: "POST" });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`IG Graph error (${resp.status}): ${json?.error?.message || "Unknown"}`);
  }
  return json;
}

async function igGet(path: string, token: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/v20.0/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);

  const resp = await fetch(url.toString());
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`IG Graph error (${resp.status}): ${json?.error?.message || "Unknown"}`);
  }
  return json;
}

export async function postToInstagram(
  igBusinessId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string
) {
  // 1) Create container
  const created = await igGraph(`${igBusinessId}/media`, pageAccessToken, {
    image_url: imageUrl,
    caption,
  });

  const creationId = created?.id;
  if (!creationId) throw new Error("IG: creation_id missing from /media response");

  // 2) Wait until container is ready (FINISHED)
  const maxTries = 12;           // ~60 sec
  const delayMs = 5000;

  for (let i = 0; i < maxTries; i++) {
    const status = await igGet(`${creationId}`, pageAccessToken, {
      fields: "status_code",
    });

    const code = status?.status_code;
    if (code === "FINISHED") break;
    if (code === "ERROR") throw new Error("IG: container status ERROR");

    await new Promise((r) => setTimeout(r, delayMs));
  }

  // 3) Publish
  const pub = await igGraph(`${igBusinessId}/media_publish`, pageAccessToken, {
    creation_id: creationId,
  });

  return pub; // { id: "ig_media_id" }
}

