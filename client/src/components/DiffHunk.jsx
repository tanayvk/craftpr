import { minimalSetup, EditorView } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { lineNumbers, gutter, ViewPlugin, Decoration } from "@codemirror/view";
import {
  StateField,
  StateEffect,
  RangeSet,
  RangeSetBuilder,
  Facet,
} from "@codemirror/state";
import { useEffect } from "react";
import { useRef } from "react";
import { openFile } from "../utils/api";
import SpinLoader from "./SpinLoader";
import Link from "./Link";
import {
  getCurrentFileLine,
  getCurrentFilePath,
  nextHunk,
  previousHunk,
  useCurrentFilePath,
  useCurrentHunk,
  useFileDiff,
  useNumHunks,
} from "../stores/hunks";
import { languageSupport } from "../utils/codemirror";

const deletedLinesState = StateField.define({
  create() {
    return RangeSet.of([{ from: 2, to: 5, value: 0 }]);
  },
  update() {},
});

const deletedMarker = new (class {
  toDOM() {
    return document.createTextNode("-");
  }
})();

const baseTheme = EditorView.baseTheme({
  // TODO: change colors
  ".cm-added": { backgroundColor: "#46954a26" },
  ".cm-deleted": { backgroundColor: "#e5534b26" },
});

const linesData = Facet.define({
  combine: (values) => {
    // if (values.length) {
    //   const s = new Set();
    //   for (const val of values) {
    //     val.forEach((v) => s.add(v));
    //   }
    //   return s;
    // }
    return values[0] || { del: new Set(), add: new Set() };
  },
});

export function lineHighlights(lines) {
  return [baseTheme, linesData.of(lines), showStripes];
}

const addStripe = Decoration.line({
  attributes: { class: "cm-added" },
});
const delStripe = Decoration.line({
  attributes: { class: "cm-deleted" },
});

function stripeDeco(view) {
  let lines = view.state.facet(linesData);
  let builder = new RangeSetBuilder();
  for (let { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      let line = view.state.doc.lineAt(pos);
      if (lines.add.has(line.number))
        builder.add(line.from, line.from, addStripe);
      if (lines.del.has(line.number))
        builder.add(line.from, line.from, delStripe);
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

const showStripes = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = stripeDeco(view);
    }

    update(update) {
      if (update.docChanged || update.viewportChanged)
        this.decorations = stripeDeco(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

// TODO: async and loader
const openCurrentFile = () => {
  const currentPath = getCurrentFilePath();
  const currentLine = getCurrentFileLine();
  if (currentPath) {
    openFile(currentPath, currentLine);
  }
};

const getDiffObject = (chunk) => {
  const lines = [],
    add = new Set(),
    del = new Set();
  chunk.changes.forEach((change, idx) => {
    lines.push(change.content);
    if (change.type === "AddedLine") {
      add.add(idx + 1);
    } else if (change.type === "DeletedLine") {
      del.add(idx + 1);
    }
  });
  return {
    content: lines.join("\n"),
    start: chunk.toFileRange.start,
    lines: { add, del },
  };
};

export default () => {
  const filePath = useCurrentFilePath();
  const hunkIndex = useCurrentHunk();
  const numHunks = useNumHunks();
  const { isPending, data } = useFileDiff(filePath);
  const divRef = useRef();
  const loaded = useRef(false);

  const loadEditor = async (diffObject) => {
    new EditorView({
      doc: data.content || diffObject?.content || "",
      extensions: [
        minimalSetup,
        EditorView.editable.of(false),
        EditorView.theme(
          {
            ".cm-content": { fontFamily: "Neon" },
            del: { textDecoration: "none" },
            "&": { width: "100%", maxHeight: "100%" },
            ".cm-scroller": { overflow: "auto" },
            ".cm-lineNumbers .cm-gutterElement": { minWidth: "50px" },
            ".cm-gutters": {
              backgroundColor: "#1e2126",
              paddingRight: "6px",
            },
          },
          { dark: true },
        ),
        await languageSupport(filePath),
        oneDark,
        // TODO: linenumbers for both from/to accounting
        // for deleted and added lines
        lineNumbers({
          formatNumber: (num) => num + (diffObject?.start || 1) - 1,
        }),
        // deletedLinesState,
        // gutter({
        //   class: "cm-deleted-line-gutter",
        //   markers: (v) => v.state.field(deletedLinesState),
        //   initialSpacer: () => deletedMarker,
        // }),
        EditorView.baseTheme({
          ".cm-breakpoint-gutter .cm-gutterElement": {
            color: "red",
            paddingLeft: "5px",
            cursor: "default",
          },
        }),
        diffObject ? lineHighlights(diffObject.lines) : [],
      ],
      parent: divRef.current,
    });
  };

  useEffect(() => {
    const currentLoaded = filePath + "/" + hunkIndex;
    if (divRef.current && loaded.current !== currentLoaded && data) {
      const diffObject =
        data.diff && getDiffObject(data.diff?.chunks[hunkIndex]);
      divRef.current.innerText = "";
      loaded.current = currentLoaded;
      loadEditor(diffObject);
    }
  }, [divRef.current, data, filePath, hunkIndex]);

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

  const showCode = data?.type === "added" || data?.diff;

  return (
    <div className="w-3/4 flex flex-col h-full">
      <div className="flex my-2 px-4">
        {showCode && <div>{`${hunkIndex + 1} / ${numHunks}`}</div>}
        <div className="flex-grow"></div>
        <div className="flex gap-2">
          <Link onClick={() => nextHunk()}>Next [N]</Link>
          <Link onClick={() => previousHunk()}>Prev [P]</Link>
          {/* TODO: open at location */}
          <Link onClick={() => openCurrentFile()}>Open [O]</Link>
        </div>
      </div>
      {isPending && <SpinLoader />}
      {data?.type === "deleted" && (
        <div className="w-full h-full flex items-center justify-center text-green-400">
          This file has been deleted.
        </div>
      )}
      {data?.type === "binary" && (
        <div className="w-full h-full flex items-center justify-center text-green-400">
          Binary file diffs are not shown.
        </div>
      )}
      <div
        className={`flex-grow overflow-scroll ${
          showCode ? "w-[80%] mx-auto visible" : "invisible w-0 h-0"
        }`}
        ref={divRef}
      ></div>
      <div className="h-14"></div>
    </div>
  );
};
