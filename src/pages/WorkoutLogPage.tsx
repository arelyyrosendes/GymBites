import { useState, type JSX } from "react";
import { useRemoteDB } from "../hooks/useRemoteDB";
import { uid } from "../utils";
import type { GeneralExercise, GeneralWorkout } from "../types";

export default function WorkoutLogPage(): JSX.Element {
  const { db, setDb, loading } = useRemoteDB();

  const addSection = (name: string) => {
    const clean = name.trim();
    if (!clean) return;

    const section: GeneralWorkout = {
      id: uid("generalWorkout"),
      name: clean,
      exercises: [],
    };

    setDb((prev) => ({
      ...prev,
      generalWorkouts: [section, ...(prev.generalWorkouts ?? [])],
    }));
  };

  const addExercise = (sectionId: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;

    const exercise: GeneralExercise = {
      id: uid("generalExercise"),
      name: clean,
    };

    setDb((prev) => ({
      ...prev,
      generalWorkouts: (prev.generalWorkouts ?? []).map((section) =>
        section.id === sectionId
          ? { ...section, exercises: [...(section.exercises ?? []), exercise] }
          : section
      ),
    }));
  };

  const removeSection = (sectionId: string) => {
    setDb((prev) => ({
      ...prev,
      generalWorkouts: (prev.generalWorkouts ?? []).filter((section) => section.id !== sectionId),
    }));
  };

  const removeExercise = (sectionId: string, exerciseId: string) => {
    setDb((prev) => ({
      ...prev,
      generalWorkouts: (prev.generalWorkouts ?? []).map((section) =>
        section.id === sectionId
          ? {
              ...section,
              exercises: (section.exercises ?? []).filter((exercise) => exercise.id !== exerciseId),
            }
          : section
      ),
    }));
  };

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Syncing your workouts…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>Workouts</h1>
        <p className="muted">
          Create your reusable workout templates here. Add sets and weight later on the dashboard.
        </p>
      </header>

      <AddRow
        placeholder="New workout section (e.g., Glutes, Legs, Push Day)"
        button="Add Section"
        onAdd={addSection}
      />

      <section className="stack">
        {(db.generalWorkouts ?? []).length === 0 ? (
          <div className="card">
            <p className="muted">No workout templates yet. Add one above.</p>
          </div>
        ) : (
          (db.generalWorkouts ?? []).map((section) => (
            <div key={section.id} className="card">
              <div className="rowBetween">
                <div>
                  <h2 style={{ margin: 0 }}>{section.name}</h2>
                  <p className="muted small" style={{ marginTop: 4 }}>
                    {(section.exercises ?? []).length} exercise(s)
                  </p>
                </div>

                <button className="btnGhost" onClick={() => removeSection(section.id)}>
                  Remove
                </button>
              </div>

              <div className="divider" />

              <AddRow
                placeholder={`Add exercise under ${section.name} (e.g., Kickbacks)`}
                button="Add Exercise"
                onAdd={(name) => addExercise(section.id, name)}
              />

              {(section.exercises ?? []).length === 0 ? (
                <p className="muted small">No exercises yet.</p>
              ) : (
                <div className="stack">
                  {(section.exercises ?? []).map((exercise) => (
                    <div key={exercise.id} className="subCard">
                      <div className="rowBetween">
                        <div>
                          <div className="itemTitle">{exercise.name}</div>
                        </div>

                        <button
                          className="btnGhost"
                          onClick={() => removeExercise(section.id, exercise.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function AddRow(props: {
  placeholder: string;
  button: string;
  onAdd: (value: string) => void;
}): JSX.Element {
  const [value, setValue] = useState("");

  return (
    <section className="card">
      <div className="row">
        <input
          className="input"
          placeholder={props.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            props.onAdd(value);
            setValue("");
          }}
        >
          {props.button}
        </button>
      </div>
    </section>
  );
}