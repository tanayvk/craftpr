import { fetchFileDiff } from "../utils/api";
import { createStore } from "../utils/zustand";

const selectHunks = (state) => {
  const currentPath = state.files[state.currentFile]?.path;
  const diff = state.fileDiffs[currentPath];
  const chunks = diff?.diff?.chunks;
  return chunks;
};

const selectNumHunks = (state) => {
  const numChunks = selectHunks(state)?.length;
  // TODO: can num chunks be zero?
  return numChunks || 1;
};

const useHunks = createStore((set, get) => ({
  files: [],
  fileDiffs: {},
  currentFile: 0,
  hunkIndex: 0,
  setHunks: (hunks) =>
    set({
      hunks,
    }),
  nextHunk: () => {
    const numHunks = selectNumHunks(get());
    const hunkIndex = ((get().hunkIndex % numHunks) + numHunks) % numHunks;
    if (hunkIndex < numHunks - 1) {
      set({
        hunkIndex: hunkIndex + 1,
      });
    } else {
      const numFiles = get().files.length;
      set({
        currentFile:
          (((get().currentFile + 1) % numFiles) + numFiles) % numFiles,
        hunkIndex: 0,
      });
    }
  },
  previousHunk: () => {
    const numHunks = selectNumHunks(get());
    const hunkIndex = ((get().hunkIndex % numHunks) + numHunks) % numHunks;
    if (hunkIndex > 0) {
      set({
        hunkIndex: hunkIndex - 1,
      });
    } else {
      const numFiles = get().files.length;
      set({
        currentFile:
          (((get().currentFile - 1) % numFiles) + numFiles) % numFiles,
        hunkIndex: -1,
      });
    }
  },
  setCurrentFile: (index) => set({ currentFile: index }),
  setDiff: (path, diff) =>
    set((state) => {
      state.fileDiffs[path] = diff;
    }),
}));

export const nextHunk = () => useHunks.getState().nextHunk();
export const previousHunk = () => useHunks.getState().previousHunk();

export const useCurrentFilePath = () =>
  useHunks((state) => {
    return state.files[state.currentFile]?.path;
  });

const selectCurrentHunk = (state) => {
  const numHunks = selectNumHunks(state);
  const hunkIndex = state.hunkIndex;
  return ((hunkIndex % numHunks) + numHunks) % numHunks;
};

export const useCurrentHunk = () => useHunks(selectCurrentHunk);

export const useNumHunks = () =>
  useHunks((state) => {
    const numHunks = selectNumHunks(state);
    return numHunks;
  });

export const getCurrentFilePath = () =>
  useHunks.getState().files[useHunks.getState().currentFile]?.path;

export const getCurrentFileLine = () => {
  const state = useHunks.getState();
  const path = getCurrentFilePath();
  const diff = state.fileDiffs[path];
  const currentHunk = selectCurrentHunk(state);
  const diffLine = diff?.diff?.chunks?.[currentHunk]?.toFileRange?.start;
  return typeof diffLine === "number" ? diffLine : 1;
};

export const setFileByPath = (path) => {
  const state = useHunks.getState();
  const fileIndex = state.files.findIndex((file) => file?.path === path);
  state.setCurrentFile(typeof fileIndex === "number" ? fileIndex : null);
};

export const setFiles = (files) => {
  useHunks.setState({
    files,
  });
};

export const useFileDiff = (filePath) => {
  const fileDiff = useHunks((state) => state.fileDiffs[filePath]);
  if (!filePath) {
    return {
      isPending: false,
      data: null,
    };
  }
  if (fileDiff) {
    return {
      isPending: false,
      data: fileDiff,
    };
  } else {
    fetchFileDiff(filePath).then((diff) => {
      useHunks.getState().setDiff(filePath, diff);
    });
    return {
      isPending: true,
      data: null,
    };
  }
};
