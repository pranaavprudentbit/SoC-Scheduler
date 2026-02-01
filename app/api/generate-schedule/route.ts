import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { User, ShiftType } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { users, startDate, days, shiftConfig } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = "gemini-3-flash-preview";

    // Use provided shift config or defaults
    const { DEFAULT_SHIFT_CONFIG } = await import('@/lib/shiftConfig');
    const config = shiftConfig || DEFAULT_SHIFT_CONFIG;

    // Prepare context for the model
    const userContext = users.map((u: User) => ({
      id: u.id,
      name: u.name,
      prefs: u.preferences,
    }));

    const prompt = `
    You are an expert SOC Shift Manager. Generate a fair schedule for ${days} days starting from ${startDate}.
    
    SHIFT TIMINGS (IMPORTANT - USE THESE EXACT TIMES):
    
    Night Shift (First shift of the day):
    - Start: ${config.Night.start}
    - End: ${config.Night.end}
    - Lunch Break: ${config.Night.lunchStart} - ${config.Night.lunchEnd} (45 mins)
    - Break: ${config.Night.breakStart} - ${config.Night.breakEnd} (15 mins)
    - Total Duration: 8 hours (INCLUDES all breaks)
    
    Morning Shift (Second shift of the day):
    - Start: ${config.Morning.start}
    - End: ${config.Morning.end}
    - Lunch Break: ${config.Morning.lunchStart} - ${config.Morning.lunchEnd} (45 mins)
    - Break: ${config.Morning.breakStart} - ${config.Morning.breakEnd} (15 mins)
    - Total Duration: 8 hours (INCLUDES all breaks)
    
    Evening Shift (Third shift of the day):
    - Start: ${config.Evening.start}
    - End: ${config.Evening.end}
    - Lunch Break: ${config.Evening.lunchStart} - ${config.Evening.lunchEnd} (45 mins)
    - Break: ${config.Evening.breakStart} - ${config.Evening.breakEnd} (15 mins)
    - Total Duration: 8 hours (INCLUDES all breaks)
    
    CRITICAL DAY BOUNDARY LOGIC:
    - **Day Start**: The "Day" begins at 01:00 AM with the Night Shift.
    - **Sequence**: Night -> Morning -> Evening
    - **Date Alignment**: All three shifts belong to the SAME calendar date.
      - Example: "Monday" shifts are:
        1. Mon 01:00 AM (Night)
        2. Mon 09:00 AM (Morning)
        3. Mon 05:00 PM (Evening) -> Ends Tues 01:00 AM
    - Use this logic strictly for assigning "Day Off" and grouping shifts.

    CRITICAL REQUIREMENTS:
    - Each user MUST work exactly 5 shifts per week (7 days)
    - Each shift duration includes work time + lunch + break (No extra hours added)
    - No Overlaps between shifts. 09:00 is strictly end of Night and start of Morning.
    
    SHIFT STRUCTURE PER DAY:
    - Only 3 users work per day (1 Morning, 1 Evening, 1 Night)
    - Each shift type should have EXACTLY 1 person assigned
    - All other users are OFF/on leave that day
    
    Constraints:
    1. **5 Shifts Per Week**: Every user must have EXACTLY 5 shifts within each 7-day period.
    2. **3 Workers Per Day**: Each day must have exactly 3 shifts total (1 Morning, 1 Evening, 1 Night).
    3. **Smart Rest Management**: 
       - Each user gets 2 consecutive days off per week where possible.
       - Ensure everyone gets at least 1 weekend day off in rotation.
    4. **Fair Rotation**: 
       - Rotate Night shifts evenly.
    5. **No Back-to-Back Shifts**: Never assign consecutive shifts (e.g. Evening -> Morning next day is OK logic-wise as 8 hours rest, but harder. Avoid if possible).
       - STRICTLY FORBIDDEN: Morning -> Evening on same day (doubles).
       - STRICTLY FORBIDDEN: Night -> Morning on same day.
    6. **Avoid Burnout**: Try to give users who worked Night shift a rest day after.
    7. **Preferences**: Respect 'unavailableDates'.
    8. **Use Configured Break Times**: Always use the exact break times specified above.
    
    Users: ${JSON.stringify(userContext)}
    
    Return a JSON array of Shift objects.
  `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "YYYY-MM-DD" },
              type: {
                type: Type.STRING,
                enum: [ShiftType.NIGHT, ShiftType.MORNING, ShiftType.EVENING],
              },
              userId: { type: Type.STRING },
              lunchStart: { type: Type.STRING, description: "HH:mm" },
              lunchEnd: { type: Type.STRING, description: "HH:mm" },
              breakStart: { type: Type.STRING, description: "HH:mm" },
              breakEnd: { type: Type.STRING, description: "HH:mm" },
            },
            required: [
              "date",
              "type",
              "userId",
              "lunchStart",
              "lunchEnd",
              "breakStart",
              "breakEnd",
            ],
          },
        },
      },
    });

    const rawData = response.text;
    if (!rawData) {
      return NextResponse.json(
        { error: "No data returned from Gemini" },
        { status: 500 }
      );
    }

    const parsedShifts = JSON.parse(rawData);

    // Save shifts to Firestore
    const shiftsCollection = adminDb.collection('shifts');

    // Get today's date to prevent rescheduling current/past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Only delete FUTURE shifts (tomorrow onwards)
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all existing manual shifts to preserve them
    const manualShiftsQuery = await shiftsCollection
      .where('manuallyCreated', '==', true)
      .where('date', '>=', tomorrowStr)
      .where('date', '<', endDateStr)
      .get();

    const manualShifts = manualShiftsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Only delete AUTO-GENERATED shifts from tomorrow onwards, never delete manual shifts or current/past dates
    const oldShiftsQuery = await shiftsCollection
      .where('date', '>=', tomorrowStr)
      .where('date', '<', endDateStr)
      .get();

    const batch = adminDb.batch();
    oldShiftsQuery.docs.forEach((doc) => {
      const data = doc.data();
      // Only delete if NOT manually created
      if (!data.manuallyCreated) {
        batch.delete(doc.ref);
      }
    });

    // Insert new shifts
    const insertedShifts: any[] = [];
    for (const shift of parsedShifts) {
      // Skip if shift date is today or in the past - never reschedule current/past dates
      if (shift.date <= todayStr) {
        console.log(`Skipping ${shift.date} - current or past date, only swaps allowed`);
        continue;
      }

      // Skip if there's a manually created shift for this date and shift type
      const hasManualShift = manualShifts.some(
        (ms: any) => ms.date === shift.date && ms.shift === shift.type
      );

      if (hasManualShift) {
        console.log(`Skipping ${shift.date} ${shift.type} - manually created shift exists, AI cannot override`);
        continue;
      }

      const docRef = shiftsCollection.doc();
      batch.set(docRef, {
        date: shift.date,
        shift: shift.type,
        userId: shift.userId,
        lunchStart: shift.lunchStart,
        lunchEnd: shift.lunchEnd,
        breakStart: shift.breakStart,
        breakEnd: shift.breakEnd,
        manuallyCreated: false, // Mark as AI-generated
        createdAt: new Date().toISOString(),
      });
      insertedShifts.push({
        id: docRef.id,
        date: shift.date,
        type: shift.type,
        userId: shift.userId,
        lunchStart: shift.lunchStart,
        lunchEnd: shift.lunchEnd,
        breakStart: shift.breakStart,
        breakEnd: shift.breakEnd,
        manuallyCreated: false,
      });
    }

    await batch.commit();

    return NextResponse.json(insertedShifts);
  } catch (error) {
    console.error("Failed to generate schedule:", error);
    return NextResponse.json(
      { error: "Failed to generate schedule" },
      { status: 500 }
    );
  }
}
