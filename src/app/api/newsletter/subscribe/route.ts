import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Filter, Document } from "mongodb";

export const dynamic = "force-dynamic";

// Newsletter subscriber interface
interface NewsletterSubscriber extends Document {
  email: string;
  subscribedAt: Date;
  status: string;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get newsletter collection with proper typing
    const db = await getDb();
    const newsletterCollection = db.collection<NewsletterSubscriber>("newsletter_subscribers");

    // Check if email already exists
    const filter: Filter<NewsletterSubscriber> = { email: email.toLowerCase() };
    const existingSubscriber = await newsletterCollection.findOne(filter);

    if (existingSubscriber) {
      return NextResponse.json(
        { error: "This email is already subscribed" },
        { status: 409 }
      );
    }

    // Insert new subscriber
    const newSubscriber: Omit<NewsletterSubscriber, '_id'> = {
      email: email.toLowerCase(),
      subscribedAt: new Date(),
      status: "active",
    };

    await newsletterCollection.insertOne(newSubscriber as NewsletterSubscriber);

    return NextResponse.json(
      { message: "Successfully subscribed to newsletter!" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
