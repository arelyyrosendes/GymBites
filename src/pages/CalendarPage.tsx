import { useMemo, useState, type JSX } from "react";
import { useLocalDB } from "../hooks/useLocalDB";
import { todayISO } from "../utils";
import type { Recipe } from "../types";

export default function CalendarPage(): JSX.Element {
  const { db } = useLocalDB();
  const [date, setDate] = useState(todayISO());

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

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>GymBites</h1>
        <p className="muted">Calendar: workouts + meals for the day</p>
      </header>

      <section className="card">
        <label className="label">Pick a date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </section>

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
                <div className="muted small">P {totals.protein} • C {totals.carbs} • F {totals.fat}</div>
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
