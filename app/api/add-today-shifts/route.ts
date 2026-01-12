import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { shifts } = await request.json();

    if (!shifts || !Array.isArray(shifts)) {
      return NextResponse.json(
        { error: "Invalid shifts data" },
        { status: 400 }
      );
    }

    const shiftsCollection = adminDb.collection('shifts');
    const today = '2026-01-12';

    // Delete any existing shifts for today
    const existingShifts = await shiftsCollection
      .where('date', '==', today)
      .get();
    
    const batch = adminDb.batch();
    existingShifts.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new shifts for today
    for (const shift of shifts) {
      const shiftRef = shiftsCollection.doc();
      batch.set(shiftRef, {
        ...shift,
        createdAt: new Date().toISOString()
      });
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: "Today's shifts added successfully" 
    });
  } catch (error) {
    console.error("Failed to add today's shifts:", error);
    return NextResponse.json(
      { error: "Failed to add shifts" },
      { status: 500 }
    );
  }
}
