import { useMemo, useState, type JSX } from "react";
import { useRemoteDB } from "../hooks/useRemoteDB";
import { uid, todayISO, clampNumber } from "../utils";
import type { Recipe } from "../types";

export default function MealsPage(): JSX.Element {
  const { db, setDb, loading } = useRemoteDB();
  const [date, setDate] = useState(todayISO());

  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const dayEntry = useMemo(() => db.mealsByDay.find((m) => m.date === date) ?? null, [db.mealsByDay, date]);

  const addRecipe = () => {
    const clean = name.trim();
    if (!clean) return;

    const recipe: Recipe = {
      id: uid("recipe"),
      name: clean,
      nutrients: {
        calories: clampNumber(calories, 0, 10000),
        protein: clampNumber(protein, 0, 1000),
        carbs: clampNumber(carbs, 0, 1000),
        fat: clampNumber(fat, 0, 1000),
      },
    };

    setDb((prev) => ({ ...prev, recipes: [recipe, ...prev.recipes] }));
    setName("");
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
  };

  const toggleRecipeForDay = (recipeId: string) => {
    setDb((prev) => {
      const existing = prev.mealsByDay.find((m) => m.date === date);
      if (!existing) {
        return { ...prev, mealsByDay: [{ id: uid("dayMeals"), date, recipeIds: [recipeId] }, ...prev.mealsByDay] };
      }
      const has = existing.recipeIds.includes(recipeId);
      const nextIds = has ? existing.recipeIds.filter((id) => id !== recipeId) : [...existing.recipeIds, recipeId];
      return {
        ...prev,
        mealsByDay: prev.mealsByDay.map((m) => (m.id === existing.id ? { ...m, recipeIds: nextIds } : m)),
      };
    });
  };

  const plannedIds = new Set(dayEntry?.recipeIds ?? []);

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Syncing your meals…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>Meal Logs</h1>
        <p className="muted">Create recipes + nutrients, then add them to a day.</p>
      </header>

      <section className="card">
        <label className="label">Meal date</label>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </section>

      <section className="card">
        <h2>Recipe Book</h2>

        <div className="stack">
          <div className="field">
            <label className="label">Recipe name</label>
            <input className="input" placeholder="e.g., Chicken + rice bowl" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid4">
            <NutrientField label="Calories" value={calories} onChange={setCalories} />
            <NutrientField label="Protein (g)" value={protein} onChange={setProtein} />
            <NutrientField label="Carbs (g)" value={carbs} onChange={setCarbs} />
            <NutrientField label="Fat (g)" value={fat} onChange={setFat} />
          </div>

          <button className="btn" onClick={addRecipe}>
            Add Recipe
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Plan / Log for {date}</h2>

        {db.recipes.length === 0 ? (
          <p className="muted">No recipes yet. Add one above.</p>
        ) : (
          <div className="stack">
            {db.recipes.map((r) => {
              const selected = plannedIds.has(r.id);
              return (
                <button
                  key={r.id}
                  className={`selectRow ${selected ? "selected" : ""}`}
                  onClick={() => toggleRecipeForDay(r.id)}
                >
                  <div className="rowBetween">
                    <div>
                      <div className="itemTitle">{r.name}</div>
                      <div className="muted small">
                        {r.nutrients.calories} cal • P {r.nutrients.protein} • C {r.nutrients.carbs} • F {r.nutrients.fat}
                      </div>
                    </div>
                    <span className="pill">{selected ? "Added" : "Add"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function NutrientField(props: { label: string; value: number; onChange: (n: number) => void }): JSX.Element {
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <input
        className="input"
        type="number"
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        min={0}
      />
    </div>
  );
}
