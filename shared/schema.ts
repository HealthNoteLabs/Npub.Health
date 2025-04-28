import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  pubkey: text("pubkey").notNull().unique(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const healthMetrics = z.object({
  running: z.object({
    weeklyDistance: z.number().optional(),
    lastRunDate: z.string().optional(),
    avgPace: z.number().optional(),
    totalRuns: z.number().optional()
  }),
  meditation: z.object({
    weeklyMinutes: z.number().optional(),
    currentStreak: z.number().optional(),
    lastSession: z.string().optional()
  }),
  habits: z.object({
    completed: z.number().optional(),
    total: z.number().optional(),
    streak: z.number().optional()
  }),
  sleep: z.object({
    avgDuration: z.number().optional(),
    quality: z.number().optional(),
    lastNight: z.number().optional()
  }),
  nutrition: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    water: z.number().optional()
  }),
  spiritual: z.object({
    meditationMinutes: z.number().optional(),
    journalEntries: z.number().optional(),
    gratitudeNotes: z.number().optional()
  }),
  lifting: z.object({
    totalWeight: z.number().optional(),
    personalBests: z.number().optional(),
    workouts: z.number().optional()
  }),
  weight: z.object({
    value: z.number().optional(),
    unit: z.enum(['kg', 'lb']).optional(),
    timestamp: z.string().optional(),
    history: z.array(z.object({ value: z.number(), timestamp: z.string() })).optional()
  }).optional(),
  height: z.object({
    value: z.number().optional(),
    unit: z.enum(['cm', 'in']).optional(),
    timestamp: z.string().optional()
  }).optional(),
  age: z.object({
    value: z.number().optional(),
    timestamp: z.string().optional(),
    birthdate: z.string().optional()
  }).optional(),
  gender: z.object({
    value: z.string().optional(),
    timestamp: z.string().optional()
  }).optional(),
  fitnessLevel: z.object({
    value: z.number().optional(),
    timestamp: z.string().optional()
  }).optional(),
  workouts: z.array(z.object({
    id: z.string().optional(),
    type: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    duration: z.number().optional(),
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.number().optional(),
      reps: z.number().optional(),
      weight: z.number().optional(),
      weightUnit: z.enum(['kg', 'lb']).optional(),
      duration: z.number().optional(),
      distance: z.number().optional(),
      notes: z.string().optional()
    })).optional(),
    totalCalories: z.number().optional(),
    notes: z.string().optional()
  })).optional()
});

export type HealthMetrics = z.infer<typeof healthMetrics>;
export type User = typeof users.$inferSelect;
