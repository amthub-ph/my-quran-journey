import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const subscription =
      (await request.json()) as PushSubscriptionBody;

    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Invalid push subscription." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      );

    if (error) {
      console.error("Push subscription database error:", error);

      return NextResponse.json(
        { error: "Could not save push subscription." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Push notifications enabled.",
    });
  } catch (error) {
    console.error("Push subscription error:", error);

    return NextResponse.json(
      { error: "Could not register this device." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID public key is not configured." },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey });
}