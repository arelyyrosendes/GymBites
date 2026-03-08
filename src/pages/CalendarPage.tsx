import { useMemo, useState, type JSX } from "react";
import { useRemoteDB } from "../hooks/useRemoteDB";
import { todayISO, uid } from "../utils";
import type {
  DailyExercise,
  DailyWorkoutSection,
  DayWorkoutEntry,
  GeneralWorkout,
  LoggedSet,
  Recipe,
} from "../types";

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
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
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

function cloneGeneralWorkoutToDaily(template: GeneralWorkout): DailyWorkoutSection {
  return {
    id: uid("dailySection"),
    templateId: template.id,
    name: template.name,
    exercises: (template.exercises ?? []).map((exercise) => ({
      id: uid("dailyExercise"),
      name: exercise.name,
      sets: [],
    })),
  };
}

export default function CalendarPage(): JSX.Element {
  const { db, setDb, loading } = useRemoteDB();
  const [date, setDate] = useState(todayISO());

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutModalStep, setWorkoutModalStep] = useState<"select" | "edit">("select");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [draftSection, setDraftSection] = useState<DailyWorkoutSection | null>(null);
  const [newExerciseName, setNewExerciseName] = useState("");

  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

  const selectedDateObj = useMemo(() => parseISODate(date), [date]);

  const weekStart = useMemo(() => startOfWeek(selectedDateObj), [selectedDateObj]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = weekDays[6];

  const dayWorkoutEntry = useMemo(
    () => (db.workouts ?? []).find((w) => w.date === date) ?? null,
    [db.workouts, date]
  );

  const dayMealsEntry = useMemo(
    () => (db.mealsByDay ?? []).find((m) => m.date === date) ?? null,
    [db.mealsByDay, date]
  );

  const dayMeals = useMemo(() => {
    const recipesById = new Map<string, Recipe>((db.recipes ?? []).map((r) => [r.id, r]));
    return (dayMealsEntry?.recipeIds ?? [])
      .map((id) => recipesById.get(id))
      .filter((recipe): recipe is Recipe => Boolean(recipe));
  }, [dayMealsEntry, db.recipes]);

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

  const generalWorkouts = useMemo(() => db.generalWorkouts ?? [], [db.generalWorkouts]);
  const recipes = useMemo(() => db.recipes ?? [], [db.recipes]);

  const selectedLabel = useMemo(
    () =>
      selectedDateObj.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [selectedDateObj]
  );

  function openWorkoutModal(): void {
    setIsWorkoutModalOpen(true);
    setWorkoutModalStep("select");
    setSelectedTemplateId("");
    setDraftSection(null);
    setNewExerciseName("");
  }

  function closeWorkoutModal(): void {
    setIsWorkoutModalOpen(false);
    setWorkoutModalStep("select");
    setSelectedTemplateId("");
    setDraftSection(null);
    setNewExerciseName("");
  }

  function chooseGeneralWorkout(templateId: string): void {
    const template = generalWorkouts.find((item) => item.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    setDraftSection(cloneGeneralWorkoutToDaily(template));
    setWorkoutModalStep("edit");
  }

  function addExerciseToDraft(): void {
    const clean = newExerciseName.trim();
    if (!clean) return;

    setDraftSection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: [...(prev.exercises ?? []), { id: uid("dailyExercise"), name: clean, sets: [] }],
      };
    });

    setNewExerciseName("");
  }

  function removeExerciseFromDraft(exerciseId: string): void {
    setDraftSection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: (prev.exercises ?? []).filter((exercise) => exercise.id !== exerciseId),
      };
    });
  }

  function addSetToDraftExercise(exerciseId: string): void {
    setDraftSection((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: (prev.exercises ?? []).map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: [...(exercise.sets ?? []), { id: uid("set"), weight: 0, reps: 0 }],
              }
            : exercise
        ),
      };
    });
  }

  function removeSetFromDraftExercise(exerciseId: string, setId: string): void {
    setDraftSection((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: (prev.exercises ?? []).map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: (exercise.sets ?? []).filter((setItem) => setItem.id !== setId),
              }
            : exercise
        ),
      };
    });
  }

  function updateDraftSet(
    exerciseId: string,
    setId: string,
    field: keyof Pick<LoggedSet, "weight" | "reps">,
    value: number
  ): void {
    setDraftSection((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: (prev.exercises ?? []).map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: (exercise.sets ?? []).map((setItem) =>
                  setItem.id === setId
                    ? { ...setItem, [field]: Number.isNaN(value) ? 0 : value }
                    : setItem
                ),
              }
            : exercise
        ),
      };
    });
  }

  function saveDraftSectionToDay(): void {
    if (!draftSection) return;

    setDb((prev) => {
      const existingDayIndex = (prev.workouts ?? []).findIndex((entry) => entry.date === date);

      if (existingDayIndex >= 0) {
        const updatedWorkouts = [...prev.workouts];
        const existingDay = updatedWorkouts[existingDayIndex]!;

        updatedWorkouts[existingDayIndex] = {
          ...existingDay,
          sections: [...(existingDay.sections ?? []), draftSection],
        };

        return { ...prev, workouts: updatedWorkouts };
      }

      const newDayEntry: DayWorkoutEntry = {
        id: uid("workoutDay"),
        date,
        sections: [draftSection],
        notes: "",
      };

      return {
        ...prev,
        workouts: [...(prev.workouts ?? []), newDayEntry],
      };
    });

    closeWorkoutModal();
  }

  function removeSectionFromDay(sectionId: string): void {
    setDb((prev) => {
      const updatedWorkouts = (prev.workouts ?? [])
        .map((entry) => {
          if (entry.date !== date) return entry;
          return {
            ...entry,
            sections: (entry.sections ?? []).filter((section) => section.id !== sectionId),
          };
        })
        .filter((entry) => (entry.sections ?? []).length > 0);

      return { ...prev, workouts: updatedWorkouts };
    });
  }

  function openMealModal(): void {
    setIsMealModalOpen(true);
  }

  function closeMealModal(): void {
    setIsMealModalOpen(false);
  }

  function addRecipeToDay(recipeId: string): void {
    setDb((prev) => {
      const existingMealIndex = (prev.mealsByDay ?? []).findIndex((entry) => entry.date === date);

      if (existingMealIndex >= 0) {
        const updatedMeals = [...prev.mealsByDay];
        const existingEntry = updatedMeals[existingMealIndex]!;
        const alreadyIncluded = (existingEntry.recipeIds ?? []).includes(recipeId);

        updatedMeals[existingMealIndex] = {
          ...existingEntry,
          recipeIds: alreadyIncluded
            ? existingEntry.recipeIds
            : [...(existingEntry.recipeIds ?? []), recipeId],
        };

        return { ...prev, mealsByDay: updatedMeals };
      }

      return {
        ...prev,
        mealsByDay: [
          ...(prev.mealsByDay ?? []),
          {
            id: uid("mealDay"),
            date,
            recipeIds: [recipeId],
          },
        ],
      };
    });

    closeMealModal();
  }

  function removeMealFromDay(recipeId: string): void {
    setDb((prev) => {
      const updatedMeals = (prev.mealsByDay ?? [])
        .map((entry) => {
          if (entry.date !== date) return entry;
          return {
            ...entry,
            recipeIds: (entry.recipeIds ?? []).filter((id) => id !== recipeId),
          };
        })
        .filter((entry) => (entry.recipeIds ?? []).length > 0);

      return { ...prev, mealsByDay: updatedMeals };
    });
  }

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
              className="ghostButton"
              onClick={goToPreviousWeek}
              aria-label="Previous week"
            >
              ←
            </button>
            <button
              type="button"
              className="ghostButton"
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

            const workoutSectionsCount =
              (db.workouts ?? []).find((w) => w.date === iso)?.sections?.length ?? 0;

            const mealsEntry = (db.mealsByDay ?? []).find((m) => m.date === iso);
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
                  border: isSelected
                    ? "1px solid rgba(255,255,255,0.28)"
                    : "1px solid rgba(255,255,255,0.12)",
                  background: isSelected
                    ? "linear-gradient(180deg, rgba(35,61,148,0.45), rgba(10,18,50,0.9))"
                    : "rgba(255,255,255,0.03)",
                  color: "inherit",
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? "0 0 0 1px rgba(68, 114, 255, 0.25) inset"
                    : "none",
                }}
              >
                <div className="muted small">{formatWeekday(day)}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "4px" }}>
                  {formatMonthDay(day)}
                </div>
                <div className="muted small" style={{ marginTop: "8px", lineHeight: 1.4 }}>
                  {workoutSectionsCount} workout{workoutSectionsCount === 1 ? "" : "s"}
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
        <div className="card dashboardCard">
          <div className="dashboardCardTop">
            <div>
              <h2>Workouts</h2>
              <p className="muted">Your logged workout sections for this day.</p>
            </div>

            <button
              type="button"
              className="cornerPlusButton"
              onClick={openWorkoutModal}
              aria-label="Add workout"
              title="Add workout"
            >
              +
            </button>
          </div>

          {(dayWorkoutEntry?.sections ?? []).length === 0 ? (
            <p className="muted">No workouts logged for this day.</p>
          ) : (
            <div className="stack">
              {(dayWorkoutEntry?.sections ?? []).map((section) => (
                <div key={section.id} className="entryCard">
                  <div className="entryHeaderRow">
                    <h3>{section.name}</h3>
                    <button
                      type="button"
                      className="ghostDangerButton iconOnly"
                      onClick={() => removeSectionFromDay(section.id)}
                      aria-label="Remove section"
                    >
                      –
                    </button>
                  </div>

                  <div className="exerciseList">
                    {(section.exercises ?? []).map((exercise) => (
                      <div key={exercise.id} className="exerciseBlock">
                        <strong>{exercise.name}</strong>

                        {(exercise.sets ?? []).length === 0 ? (
                          <div className="muted small" style={{ marginTop: 6 }}>
                            No sets added yet
                          </div>
                        ) : (
                          <div className="setList">
                            {(exercise.sets ?? []).map((setItem, index) => (
                              <div key={setItem.id} className="setRow">
                                <span className="muted">
                                  Set {index + 1}: {setItem.weight} lb × {setItem.reps} reps
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card dashboardCard">
          <div className="dashboardCardTop">
            <div>
              <h2>Meals</h2>
              <p className="muted">Meals planned or logged for this day.</p>
            </div>

            <button
              type="button"
              className="cornerPlusButton"
              onClick={openMealModal}
              aria-label="Add meal"
              title="Add meal"
            >
              +
            </button>
          </div>

          {dayMeals.length === 0 ? (
            <p className="muted">No meals planned/logged for this day.</p>
          ) : (
            <>
              <div className="stack">
                {dayMeals.map((r) => (
                  <div key={r.id} className="entryCard">
                    <div className="entryHeaderRow">
                      <div>
                        <div className="itemTitle">{r.name}</div>
                        <div className="muted small">
                          {r.nutrients.calories} cal • P {r.nutrients.protein} • C {r.nutrients.carbs} •
                          {" "}F {r.nutrients.fat}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="ghostDangerButton"
                        onClick={() => removeMealFromDay(r.id)}
                      >
                        Remove
                      </button>
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
        Tip: Build workout templates in <b>Workouts</b> and add recipes/meals in <b>Meals</b>.
      </p>

      {isWorkoutModalOpen ? (
        <div className="modalOverlay" onClick={closeWorkoutModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            {workoutModalStep === "select" ? (
              <>
                <div className="cardHeaderRow">
                  <div>
                    <h2>Add Workout</h2>
                    <p className="muted">Choose one of your saved workout templates.</p>
                  </div>

                  <button type="button" className="ghostButton" onClick={closeWorkoutModal}>
                    Close
                  </button>
                </div>

                {generalWorkouts.length === 0 ? (
                  <div className="emptyState">
                    <p>No workout templates yet. Add them in the Workouts tab first.</p>
                  </div>
                ) : (
                  <div className="stack">
                    {generalWorkouts.map((workout) => (
                      <button
                        key={workout.id}
                        type="button"
                        className="selectRow"
                        onClick={() => chooseGeneralWorkout(workout.id)}
                      >
                        <div className="itemTitle">{workout.name}</div>
                        <div className="muted small">
                          {(workout.exercises ?? []).length} exercise
                          {(workout.exercises ?? []).length === 1 ? "" : "s"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="cardHeaderRow">
                  <div>
                    <h2>Edit Workout</h2>
                    <p className="muted">
                      Customize this daily copy without changing your main template.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="ghostButton"
                      onClick={() => setWorkoutModalStep("select")}
                    >
                      Back
                    </button>
                    <button type="button" className="ghostButton" onClick={closeWorkoutModal}>
                      Close
                    </button>
                  </div>
                </div>

                {draftSection ? (
                  <div className="stack">
                    <div className="sectionPreviewHeader">
                      <h3>{draftSection.name}</h3>
                      <p className="muted">Add/remove exercises and log sets for today.</p>
                    </div>

                    <div className="row">
                      <input
                        className="input"
                        placeholder="Add another exercise for today"
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                      />
                      <button type="button" className="btn" onClick={addExerciseToDraft}>
                        Add Exercise
                      </button>
                    </div>

                    {(draftSection.exercises ?? []).map((exercise: DailyExercise) => (
                      <div key={exercise.id} className="exerciseEditorCard">
                        <div className="entryHeaderRow">
                          <div className="exerciseTitle">
                            <strong>{exercise.name}</strong>
                          </div>

                          <button
                            type="button"
                            className="ghostDangerButton"
                            onClick={() => removeExerciseFromDraft(exercise.id)}
                          >
                            -
                          </button>
                        </div>

                        {(exercise.sets ?? []).length === 0 ? (
                          <p className="muted small">No sets yet for this exercise.</p>
                        ) : null}

                        {(exercise.sets ?? []).map((setItem, index) => (
                          <div key={setItem.id} className="setEditorRow">
                            <div className="entryHeaderRow">
                              <div className="setLabel">
                                <span className="muted">Set {index + 1}</span>
                              </div>

                              <button
                                type="button"
                                className="ghostDangerButton"
                                onClick={() => removeSetFromDraftExercise(exercise.id, setItem.id)}
                              >
                                -
                              </button>
                            </div>

                            <div className="setEditorGrid">
                              <div className="formGroup">
                                <label
                                  className="label"
                                  htmlFor={`${exercise.id}-${setItem.id}-weight`}
                                >
                                  Weight
                                </label>
                                <input
                                  id={`${exercise.id}-${setItem.id}-weight`}
                                  type="number"
                                  min={0}
                                  className="input"
                                  value={setItem.weight}
                                  onChange={(e) =>
                                    updateDraftSet(
                                      exercise.id,
                                      setItem.id,
                                      "weight",
                                      parseInt(e.target.value || "0", 10)
                                    )
                                  }
                                />
                              </div>

                              <div className="formGroup">
                                <label
                                  className="label"
                                  htmlFor={`${exercise.id}-${setItem.id}-reps`}
                                >
                                  Reps
                                </label>
                                <input
                                  id={`${exercise.id}-${setItem.id}-reps`}
                                  type="number"
                                  min={0}
                                  className="input"
                                  value={setItem.reps}
                                  onChange={(e) =>
                                    updateDraftSet(
                                      exercise.id,
                                      setItem.id,
                                      "reps",
                                      parseInt(e.target.value || "0", 10)
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="ghostButton"
                          onClick={() => addSetToDraftExercise(exercise.id)}
                        >
                          + Add Set
                        </button>
                      </div>
                    ))}

                    <div className="modalActions">
                      <button
                        type="button"
                        className="ghostButton"
                        onClick={() => setWorkoutModalStep("select")}
                      >
                        Back
                      </button>
                      <button type="button" className="primaryButton" onClick={saveDraftSectionToDay}>
                        Save Workout
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {isMealModalOpen ? (
        <div className="modalOverlay" onClick={closeMealModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="cardHeaderRow">
              <div>
                <h2>Add Meal</h2>
                <p className="muted">Choose one of your saved meals to add to this day.</p>
              </div>

              <button type="button" className="ghostButton" onClick={closeMealModal}>
                Close
              </button>
            </div>

            {recipes.length === 0 ? (
              <div className="emptyState">
                <p>No saved meals yet. Add meals in the Meals tab first.</p>
              </div>
            ) : (
              <div className="stack">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    className="selectRow"
                    onClick={() => addRecipeToDay(recipe.id)}
                  >
                    <div className="itemTitle">{recipe.name}</div>
                    <div className="muted small">
                      {recipe.nutrients.calories} cal • P {recipe.nutrients.protein} • C{" "}
                      {recipe.nutrients.carbs} • F {recipe.nutrients.fat}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
