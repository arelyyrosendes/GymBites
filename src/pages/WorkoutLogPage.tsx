import { useMemo, useState, type JSX } from "react";
import { useRemoteDB } from "../hooks/useRemoteDB";
import { uid, todayISO, clampNumber } from "../utils";
import type { DayWorkoutEntry, WorkoutSection, WorkoutSubSection } from "../types";

export default function WorkoutLogPage(): JSX.Element {
  const { db, setDb, loading } = useRemoteDB();
  const [date, setDate] = useState(todayISO());

  const entry = useMemo(() => {
    return db.workouts.find((w) => w.date === date) ?? null;
  }, [db.workouts, date]);

  const ensureEntry = (): DayWorkoutEntry => {
    const existing = db.workouts.find((w) => w.date === date);
    if (existing) return existing;

    const created: DayWorkoutEntry = { id: uid("workoutDay"), date, sections: [] };
    setDb((prev) => ({ ...prev, workouts: [created, ...prev.workouts] }));
    return created;
  };

  const addSection = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const day = ensureEntry();
    const section: WorkoutSection = { id: uid("section"), name: clean, exercises: [] };

    setDb((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) =>
        w.id === day.id ? { ...w, sections: [...w.sections, section] } : w
      ),
    }));
  };

  const addExercise = (sectionId: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const day = ensureEntry();
    const ex: WorkoutSubSection = { id: uid("exercise"), name: clean, sets: [] };

    setDb((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) => {
        if (w.id !== day.id) return w;
        return {
          ...w,
          sections: w.sections.map((s) =>
            s.id === sectionId ? { ...s, exercises: [...s.exercises, ex] } : s
          ),
        };
      }),
    }));
  };

  const addSet = (sectionId: string, exerciseId: string, weight: number, reps: number) => {
    const day = ensureEntry();
    setDb((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) => {
        if (w.id !== day.id) return w;
        return {
          ...w,
          sections: w.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              exercises: s.exercises.map((ex) => {
                if (ex.id !== exerciseId) return ex;
                return {
                  ...ex,
                  sets: [
                    ...ex.sets,
                    {
                      id: uid("set"),
                      weight: clampNumber(weight, 0, 2000),
                      reps: clampNumber(reps, 0, 500),
                    },
                  ],
                };
              }),
            };
          }),
        };
      }),
    }));
  };

  const removeSection = (sectionId: string) => {
    if (!entry) return;
    setDb((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) =>
        w.id === entry.id ? { ...w, sections: w.sections.filter((s) => s.id !== sectionId) } : w
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
        <h1>Workout Log</h1>
        <p className="muted">Add a section (e.g., Glutes) → add exercise (e.g., Kickbacks) → log sets</p>
      </header>

      <section className="card">
        <label className="label">Workout date</label>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </section>

      <AddRow
        placeholder="New section (e.g., Glutes)"
        button="Add Section"
        onAdd={addSection}
      />

      <section className="stack">
        {(entry?.sections ?? []).length === 0 ? (
          <div className="card">
            <p className="muted">No sections yet. Add one above.</p>
          </div>
        ) : (
          (entry?.sections ?? []).map((s) => (
            <div key={s.id} className="card">
              <div className="rowBetween">
                <div>
                  <h2 style={{ margin: 0 }}>{s.name}</h2>
                  <p className="muted small" style={{ marginTop: 4 }}>
                    {s.exercises.length} exercise(s)
                  </p>
                </div>
                <button className="btnGhost" onClick={() => removeSection(s.id)}>
                  Remove
                </button>
              </div>

              <div className="divider" />

              <AddRow
                placeholder={`Add exercise under ${s.name} (e.g., Kickbacks)`}
                button="Add Exercise"
                onAdd={(name) => addExercise(s.id, name)}
              />

              <div className="stack">
                {s.exercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    sectionId={s.id}
                    exerciseId={ex.id}
                    name={ex.name}
                    sets={ex.sets.map((st) => ({ id: st.id, weight: st.weight, reps: st.reps }))}
                    onAddSet={(w, r) => addSet(s.id, ex.id, w, r)}
                  />
                ))}
              </div>
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

function ExerciseCard(props: {
  sectionId: string;
  exerciseId: string;
  name: string;
  sets: { id: string; weight: number; reps: number }[];
  onAddSet: (weight: number, reps: number) => void;
}): JSX.Element {
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);

  return (
    <div className="subCard">
      <div className="rowBetween">
        <div>
          <div className="itemTitle">{props.name}</div>
          <div className="muted small">{props.sets.length} set(s)</div>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label className="label">Weight</label>
          <input
            className="input"
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            min={0}
          />
        </div>
        <div className="field">
          <label className="label">Reps</label>
          <input
            className="input"
            type="number"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            min={0}
          />
        </div>
        <button className="btn" onClick={() => props.onAddSet(weight, reps)}>
          Add Set
        </button>
      </div>

      {props.sets.length > 0 && (
        <>
          <div className="divider" />
          <div className="stack">
            {props.sets.map((s, idx) => (
              <div className="itemRow" key={s.id}>
                <div className="muted small">Set {idx + 1}</div>
                <div className="small">
                  {s.weight} × {s.reps}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
