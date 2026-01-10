import { useCallback, useEffect, useState } from "react";
import { loadDB, saveDB } from "../storage";

export function useLocalDB() {
  const [db, setDb] = useState(loadDB);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const refresh = useCallback(() => setDb(loadDB()), []);

  return { db, setDb, refresh };
}
