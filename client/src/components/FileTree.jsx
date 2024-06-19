import { useState } from "react";
import Link from "./Link";

const breakPath = (path) => {
  const pathSplit = path.split("/");
  const name = pathSplit.pop();
  const parent = pathSplit.join("/");
  return { name, parent };
};

const File = ({ path, filesByParent, openFile, selectedPath, depth = 0 }) => {
  const fileObj = breakPath(path);
  const [showChildren, setShowChildren] = useState(null);
  const isSelected = path === selectedPath;
  const childPaths = filesByParent[path];
  const isFolder = childPaths?.length > 0;

  const handleClick = () => {
    if (isSelected) return;
    if (isFolder) {
      setShowChildren((show) => !show);
    } else {
      openFile?.(path);
    }
  };

  return (
    <div
      className={`${
        depth ? "border-l pl-[1px] ml-10" : ""
      } border-green-400/50 text-nowrap`}
    >
      <Link onClick={handleClick} active={isSelected}>
        {(depth ? fileObj.name : path) + (!isFolder ? " >" : "")}
      </Link>
      {isFolder &&
        (showChildren || selectedPath?.startsWith(path)) &&
        childPaths.map((child) => (
          <File
            path={child}
            filesByParent={filesByParent}
            depth={depth + 1}
            openFile={openFile}
            selectedPath={selectedPath}
          />
        ))}
    </div>
  );
};

export default ({ files, openFile, selectedPath }) => {
  const filesByParent = {},
    folders = new Set();
  files.sort((a, b) => a?.path?.localeCompare(b?.path));
  for (const file of files) {
    let fileObj = breakPath(file.path);
    filesByParent[fileObj.parent] ||= [];
    filesByParent[fileObj.parent].push(file.path);
    if (fileObj.parent) {
      let curParent = fileObj.parent;
      while (curParent && !folders.has(curParent)) {
        folders.add(curParent);
        const fileObj = breakPath(curParent);
        filesByParent[fileObj.parent] ||= [];
        filesByParent[fileObj.parent].push(curParent);
        curParent = fileObj.parent;
      }
    }
  }
  // TODO: compress folders
  // const rootFilePaths = Object.keys(filesByParent)
  //   .filter((path) => {
  //     const parentPath = breakPath(path)?.parent;
  //     return !filesByParent[parentPath];
  //   })
  //   .sort((a, b) => a.localeCompare(b));
  const rootFilePaths = filesByParent[""] || [];
  return (
    <div className="bg-gray-900 w-1/4 flex flex-col px-[1%] pt-2 overflow-scroll">
      {rootFilePaths.map((file) => (
        <File
          path={file}
          filesByParent={filesByParent}
          openFile={openFile}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
};
