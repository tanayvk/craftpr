import { minimalSetup, EditorView } from "codemirror";
import { MergeView, unifiedMergeView } from "@codemirror/merge";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { useEffect } from "react";
import { useRef } from "react";
import { openFile, useFileDiff } from "../utils/api";
import SpinLoader from "./SpinLoader";
import Link from "./Link";
import {
  getCurrentFilePath,
  nextHunk,
  previousHunk,
  useCurrentFilePath,
} from "../stores/hunks";

// TODO: async and loader
const openCurrentFile = () => {
  const currentPath = getCurrentFilePath();
  if (currentPath) {
    openFile(currentPath);
  }
};

export default () => {
  const filePath = useCurrentFilePath();
  const { isPending, data } = useFileDiff(filePath);
  const divRef = useRef();
  const loaded = useRef(false);
  useEffect(() => {
    if (divRef.current && loaded.current !== filePath && data) {
      divRef.current.innerText = "";
      loaded.current = filePath;
      // console.time(filePath);
      // const merge = unifiedMergeView({
      //   highlightChanges: false,
      //   original: data.old,
      //   mergeControls: false,
      //   diffConfig: {
      //     scanLimit: 1e5,
      //   },
      // });
      // console.timeEnd(filePath);
      let view = new EditorView({
        doc: data.diff,
        extensions: [
          minimalSetup,
          EditorView.editable.of(false),
          EditorView.theme(
            {
              ".cm-content": { fontFamily: "Neon" },
              del: { textDecoration: "none" },
              "&": { width: "100%", maxHeight: "100%" },
              ".cm-scroller": { overflow: "auto" },
            },
            { dark: true },
          ),
          javascript(),
          oneDark,
        ],
        parent: divRef.current,
      });
    }
  }, [divRef.current, data, filePath]);

  useEffect(() => {
    const handler = (event) => {
      switch (event.key) {
        case "N":
        case "n":
          nextHunk();
          break;
        case "P":
        case "p":
          previousHunk();
          break;
        case "O":
        case "o":
          openCurrentFile();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);
  return (
    <>
      {isPending && <SpinLoader />}
      <div
        className={`${
          data && filePath ? "w-[60%] mx-auto visible" : "invisible w-0 h-0"
        } flex flex-col h-full`}
      >
        <div className="flex gap-2 justify-end my-2">
          <Link onClick={() => nextHunk()}>Next [N]</Link>
          <Link onClick={() => previousHunk()}>Prev [P]</Link>
          {/* TODO: open at location */}
          <Link onClick={() => openCurrentFile()}>Open [O]</Link>
        </div>
        <div className="w-full flex-grow overflow-scroll" ref={divRef}></div>
        <div className="h-14"></div>
      </div>
    </>
  );
};
