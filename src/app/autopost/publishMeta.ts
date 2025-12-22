// src/autopost/publishMeta.ts
import crypto from "node:crypto";

type PublishInput = {
  title: string;
  excerpt: string;
  url: string;
  imageUrl?: string | null;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function clip(s: string, max: number) {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function buildCaption({ title, excerpt, url }: PublishInput) {
  const t = clip(title.trim(), 120);
  const e = clip(excerpt.trim(), 700);
  return `${t}\n\n${e}\n\nRead: ${url}\n\n#relationship #dating #communication #Bondalayze`;
}

async function fbCreateFeedPost(input: PublishInput) {
  const pageId = mustEnv("FB_PAGE_ID");
  const token = mustEnv("FB_PAGE_ACCESS_TOKEN");

  const caption = buildCaption(input);

  const endpoint = `https://graph.facebook.com/v20.0/${pageId}/feed`;
  const body = new URLSearchParams({
    message: caption,
    link: input.url,
    access_token: token,
  });

  const res = await fetch(endpoint, { method: "POST", body });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`FB feed post failed: ${JSON.stringify(data)}`);
  }
  return data as { id: string };
}

async function igPublishReelOrImage(input: PublishInput) {
  // IG API requires a PUBLIC image URL (no auth, no robots, no redirect issues)
  // If no imageUrl -> skip IG
  if (!input.imageUrl) return { skipped: true as const };

  const igUserId = mustEnv("IG_USER_ID");
  const token = mustEnv("FB_PAGE_ACCESS_TOKEN");

  const caption = buildCaption(input);

  // Step 1: create media container
  const createEndpoint = `https://graph.facebook.com/v20.0/${igUserId}/media`;
  const createBody = new URLSearchParams({
    image_url: input.imageUrl,
    caption,
    access_token: token,
  });

  const createRes = await fetch(createEndpoint, { method: "POST", body: createBody });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`IG create container failed: ${JSON.stringify(createData)}`);
  }

  const creationId = createData.id as string;

  // Step 2: publish container
  const publishEndpoint = `https://graph.facebook.com/v20.0/${igUserId}/media_publish`;
  const publishBody = new URLSearchParams({
    creation_id: creationId,
    access_token: token,
  });

  const pubRes = await fetch(publishEndpoint, { method: "POST", body: publishBody });
  const pubData = await pubRes.json();
  if (!pubRes.ok) {
    throw new Error(`IG publish failed: ${JSON.stringify(pubData)}`);
  }

  return { id: pubData.id as string };
}

export async function publishToFacebookAndInstagram(input: PublishInput) {
  // idempotency key (optional) - you can store it in DB later
  const requestId = crypto.createHash("sha1").update(input.url).digest("hex").slice(0, 12);

  const fb = await fbCreateFeedPost(input);
  let ig: any = null;

  try {
    ig = await igPublishReelOrImage(input);
  } catch (e) {
    // IG fail হলেও FB post যেন থাকে
    ig = { error: String(e) };
  }

  return { requestId, facebook: fb, instagram: ig };
}
