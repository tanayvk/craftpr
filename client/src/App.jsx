import { useState, useEffect } from "react";
import "../index.css";
import FileTree from "./components/FileTree";
import DiffHunk from "./components/DiffHunk";
import { useFiles } from "./utils/api";
import SpinLoader from "./components/SpinLoader";
import { setFileByPath, useCurrentFilePath } from "./stores/hunks";

function App() {
  const { isPending, error, data } = useFiles();
  const filePath = useCurrentFilePath();

  return (
    <div className="bg-gray-800 h-full flex">
      {isPending && <SpinLoader />}
      {data && (
        <>
          <FileTree
            files={data.files}
            openFile={(path) => {
              setFileByPath(path);
            }}
            selectedPath={filePath}
          />
          <DiffHunk />
        </>
      )}
    </div>
  );
}

export default App;
