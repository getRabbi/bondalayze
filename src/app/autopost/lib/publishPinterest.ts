// src/autopost/lib/publishPinterest.ts

type PinterestCreatePinResponse = {
  id?: string;
  message?: string;
};

export async function postToPinterest(
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  link: string,
  imageUrl: string
) {
  const resp = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title,
      description,
      link,
      media_source: {
        source_type: "image_url",
        url: imageUrl,
      },
    }),
  });

  const json = (await resp.json().catch(() => ({}))) as PinterestCreatePinResponse;

  if (!resp.ok) {
    throw new Error(
      `Pinterest error (${resp.status}): ${json?.message || "Unknown"}`
    );
  }

  if (!json.id) throw new Error("Pinterest: pin create failed (no id)");
  return json.id;
}
