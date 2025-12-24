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


export async function postToInstagram(
  igBusinessId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string
) {
  // 1) Create media container
  const create = (await fbGraph(`${igBusinessId}/media`, pageAccessToken, {
    image_url: imageUrl,
    caption,
  })) as IgCreateResponse;

  if (!create.id) throw new Error("Instagram: media container create failed");

  // 2) Publish
  const publish = (await fbGraph(
    `${igBusinessId}/media_publish`,
    pageAccessToken,
    { creation_id: create.id }
  )) as IgPublishResponse;

  if (!publish.id) throw new Error("Instagram: publish failed");
  return publish.id;
}
