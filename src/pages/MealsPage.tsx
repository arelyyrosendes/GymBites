import { useState, type JSX } from "react";
import { useRemoteDB } from "../hooks/useRemoteDB";
import { uid, clampNumber } from "../utils";
import type { Recipe } from "../types";

export default function MealsPage(): JSX.Element {
  const { db, setDb, loading } = useRemoteDB();

  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  function addMealTemplate(): void {
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

    setDb((prev) => ({
      ...prev,
      recipes: [recipe, ...(prev.recipes ?? [])],
    }));

    setName("");
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
  }

  function removeMealTemplate(recipeId: string): void {
    setDb((prev) => {
      const nextRecipes = (prev.recipes ?? []).filter((recipe) => recipe.id !== recipeId);

      const nextMealsByDay = (prev.mealsByDay ?? [])
        .map((entry) => ({
          ...entry,
          items: (entry.items ?? []).filter((item) => item.recipeId !== recipeId),
        }))
        .filter((entry) => (entry.items ?? []).length > 0);

      return {
        ...prev,
        recipes: nextRecipes,
        mealsByDay: nextMealsByDay,
      };
    });
  }

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
        <h1>Meals</h1>
        <p className="muted">
          Create reusable meal templates here. Add them to a day later from the dashboard.
        </p>
      </header>

      <section className="card">
        <h2>Create Meal</h2>

        <div className="stack">
          <div className="field">
            <label className="label">Meal name</label>
            <input
              className="input"
              placeholder="e.g., Chicken + rice bowl"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid4">
            <NutrientField label="Calories" value={calories} onChange={setCalories} />
            <NutrientField label="Protein (g)" value={protein} onChange={setProtein} />
            <NutrientField label="Carbs (g)" value={carbs} onChange={setCarbs} />
            <NutrientField label="Fat (g)" value={fat} onChange={setFat} />
          </div>

          <button className="btn" onClick={addMealTemplate}>
            Save Meal
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Saved Meals</h2>

        {(db.recipes ?? []).length === 0 ? (
          <p className="muted">No meals yet. Create one above.</p>
        ) : (
          <div className="stack">
            {(db.recipes ?? []).map((recipe) => (
              <div key={recipe.id} className="subCard">
                <div className="rowBetween">
                  <div>
                    <div className="itemTitle">{recipe.name}</div>
                    <div className="muted small">
                      {recipe.nutrients.calories} cal • P {recipe.nutrients.protein} • C{" "}
                      {recipe.nutrients.carbs} • F {recipe.nutrients.fat}
                    </div>
                    {recipe.notes ? <div className="muted small">{recipe.notes}</div> : null}
                  </div>

                  <button
                    type="button"
                    className="btnGhost"
                    onClick={() => removeMealTemplate(recipe.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NutrientField(props: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}): JSX.Element {
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
