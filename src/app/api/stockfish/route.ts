export const dynamic = "force-static";

export async function GET() {
  try {
    const res = await fetch("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");
    const text = await res.text();
    return new Response(text, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new Response("console.error('Failed to load stockfish proxy');", {
      status: 500,
      headers: { "Content-Type": "application/javascript" },
    });
  }
}
