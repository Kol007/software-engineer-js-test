import React from "react";
import { PhotoEditor } from "@presentation/components/PhotoEditor/PhotoEditor";
import styles from "./App.module.scss";

const App: React.FC = () => {
  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1>Photo Canvas Editor</h1>
        <p className="text-muted">15&quot; × 10&quot; Print Canvas</p>
      </header>
      <main className={styles.appMain}>
        <PhotoEditor />
      </main>
    </div>
  );
};

export default App;
