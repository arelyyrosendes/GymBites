import { useMemo, useState, type JSX } from "react";
import { useRemoteDB } from "../hooks/useRemoteDB";
import { todayISO } from "../utils";
import type { Recipe } from "../types";

function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // make Monday the start of the week
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRangeLabel(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${start.toLocaleDateString(undefined, {
      month: "long",
    })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })} – ${end.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}, ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} – ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function CalendarPage(): JSX.Element {
  const { db, loading } = useRemoteDB();
  const [date, setDate] = useState(todayISO());

  const selectedDateObj = useMemo(() => parseISODate(date), [date]);

  const weekStart = useMemo(() => startOfWeek(selectedDateObj), [selectedDateObj]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = weekDays[6];

  const dayWorkouts = useMemo(
    () => db.workouts.filter((w) => w.date === date),
    [db.workouts, date]
  );

  const dayMeals = useMemo(() => {
    const entry = db.mealsByDay.find((m) => m.date === date);
    const recipesById = new Map<string, Recipe>(db.recipes.map((r) => [r.id, r]));
    const recipes = (entry?.recipeIds ?? [])
      .map((id) => recipesById.get(id))
      .filter(Boolean) as Recipe[];
    return recipes;
  }, [db.mealsByDay, db.recipes, date]);

  const totals = useMemo(() => {
    const sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const r of dayMeals) {
      sum.calories += r.nutrients.calories;
      sum.protein += r.nutrients.protein;
      sum.carbs += r.nutrients.carbs;
      sum.fat += r.nutrients.fat;
    }
    return sum;
  }, [dayMeals]);

  const selectedLabel = useMemo(
    () =>
      selectedDateObj.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [selectedDateObj]
  );

  const goToPreviousWeek = () => {
    setDate(formatISODate(addDays(weekStart, -7)));
  };

  const goToNextWeek = () => {
    setDate(formatISODate(addDays(weekStart, 7)));
  };

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>GymBites</h1>
        <p className="muted">Calendar: workouts + meals for the day</p>
      </header>

      {loading ? <p className="muted">Syncing your data…</p> : null}

      <section className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="label">Your week</div>
            <div className="muted small">{formatRangeLabel(weekStart, weekEnd)}</div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="button secondary"
              onClick={goToPreviousWeek}
              aria-label="Previous week"
            >
              ←
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={goToNextWeek}
              aria-label="Next week"
            >
              →
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          {weekDays.map((day) => {
            const iso = formatISODate(day);
            const isSelected = iso === date;
            const workoutsCount = db.workouts.filter((w) => w.date === iso).length;
            const mealsEntry = db.mealsByDay.find((m) => m.date === iso);
            const mealsCount = mealsEntry?.recipeIds.length ?? 0;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setDate(iso)}
                aria-pressed={isSelected}
                style={{
                  borderRadius: "16px",
                  padding: "14px 10px",
                  textAlign: "left",
                  border: isSelected ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.12)",
                  background: isSelected
                    ? "linear-gradient(180deg, rgba(35,61,148,0.45), rgba(10,18,50,0.9))"
                    : "rgba(255,255,255,0.03)",
                  color: "inherit",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 0 0 1px rgba(68, 114, 255, 0.25) inset" : "none",
                }}
              >
                <div className="muted small">{formatWeekday(day)}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "4px" }}>
                  {formatMonthDay(day)}
                </div>
                <div className="muted small" style={{ marginTop: "8px", lineHeight: 1.4 }}>
                  {workoutsCount} workout{workoutsCount === 1 ? "" : "s"}
                  <br />
                  {mealsCount} meal{mealsCount === 1 ? "" : "s"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <p className="muted small" style={{ marginTop: "8px" }}>
        Viewing: <b>{selectedLabel}</b>
      </p>

      <section className="grid2">
        <div className="card">
          <h2>Workouts</h2>
          {dayWorkouts.length === 0 ? (
            <p className="muted">No workouts logged for this day.</p>
          ) : (
            <div className="stack">
              {dayWorkouts.map((w) => (
                <div key={w.id} className="itemRow">
                  <div>
                    <div className="itemTitle">{w.sections.length} section(s)</div>
                    <div className="muted small">
                      {w.sections.map((s) => s.name).slice(0, 3).join(", ")}
                      {w.sections.length > 3 ? "…" : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Meals</h2>
          {dayMeals.length === 0 ? (
            <p className="muted">No meals planned/logged for this day.</p>
          ) : (
            <>
              <div className="stack">
                {dayMeals.map((r) => (
                  <div key={r.id} className="itemRow">
                    <div>
                      <div className="itemTitle">{r.name}</div>
                      <div className="muted small">
                        {r.nutrients.calories} cal • P {r.nutrients.protein} • C {r.nutrients.carbs} • F{" "}
                        {r.nutrients.fat}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="totalsRow">
                <div>
                  <div className="muted small">Total</div>
                  <div className="itemTitle">{totals.calories} cal</div>
                </div>
                <div className="muted small">
                  P {totals.protein} • C {totals.carbs} • F {totals.fat}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <p className="muted small">
        Tip: Add workouts in <b>Workouts</b> tab and recipes/meals in <b>Meals</b>.
      </p>
    </div>
  );
}