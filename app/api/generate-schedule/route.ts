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
    
    Morning Shift:
    - Start: ${config.Morning.start}
    - End: ${config.Morning.end}
    - Lunch Break: ${config.Morning.lunchStart} - ${config.Morning.lunchEnd} (1 hour)
    - Short Break: ${config.Morning.breakStart} - ${config.Morning.breakEnd} (30 minutes)
    - Work Hours: ${config.Morning.workHours} hours (excluding breaks)
    
    Evening Shift:
    - Start: ${config.Evening.start}
    - End: ${config.Evening.end}
    - Lunch Break: ${config.Evening.lunchStart} - ${config.Evening.lunchEnd} (1 hour)
    - Short Break: ${config.Evening.breakStart} - ${config.Evening.breakEnd} (30 minutes)
    - Work Hours: ${config.Evening.workHours} hours (excluding breaks)
    
    Night Shift:
    - Start: ${config.Night.start}
    - End: ${config.Night.end}
    - Lunch Break: ${config.Night.lunchStart} - ${config.Night.lunchEnd} (1 hour)
    - Short Break: ${config.Night.breakStart} - ${config.Night.breakEnd} (30 minutes)
    - Work Hours: ${config.Night.workHours} hours (excluding breaks)
    
    CRITICAL REQUIREMENTS:
    - Each user MUST work exactly 5 shifts per week (7 days)
    - Each shift duration includes work time + lunch + break
    - Total work hours per user per week: ${config.Morning.workHours * 5} hours (5 shifts × ${config.Morning.workHours} hours)
    
    SHIFT STRUCTURE PER DAY:
    - Only 3 users work per day (1 Morning, 1 Evening, 1 Night)
    - Each shift type should have EXACTLY 1 person assigned
    - All other users are OFF/on leave that day
    
    Constraints:
    1. **5 Shifts Per Week**: Every user must have EXACTLY 5 shifts within each 7-day period. Track this carefully.
    2. **3 Workers Per Day**: Each day must have exactly 3 shifts total (1 Morning, 1 Evening, 1 Night). No more, no less.
    3. **Smart Rest Management**: 
       - Each user gets 2 consecutive days off per week when possible
       - Avoid scheduling more than 5 consecutive work days
       - Distribute rest days fairly across all users
       - Ensure everyone gets at least 1 weekend day off in rotation
    4. **Fair Rotation**: 
       - Rotate who works on weekends fairly
       - Distribute Night shifts evenly across all users over time
       - No user should work significantly more difficult shifts than others
    5. **No Back-to-Back Shifts**: Never assign the same user consecutive shifts (e.g., Evening shift ending at ${config.Evening.end} followed by Morning shift starting at ${config.Morning.start} next day).
    6. **Avoid Burnout**: Try to give users who worked Night shift a rest day after if possible.
    7. **Preferences (OPTIONAL)**: If a user has 'unavailableDates', respect them strictly and give them leave that day. If they have 'preferredDays' or 'preferredShifts', try to accommodate them when possible. If preferences are empty or not set, generate a balanced schedule automatically.
    8. **Use Configured Break Times**: Always use the exact break times specified above for each shift type.
    
    Users: ${JSON.stringify(userContext)}
    
    NOTE: With ${users.length} users and 3 workers per day, most users will be off on any given day. This is normal and expected.
    
    IMPORTANT: 
    - Verify each user gets exactly 5 shifts per 7-day period
    - Verify each day has exactly 3 shifts (1 Morning, 1 Evening, 1 Night)
    - Ensure fair distribution of rest days and leave days across all users
    - Use the EXACT break times provided above
    
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
                enum: [ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT],
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
