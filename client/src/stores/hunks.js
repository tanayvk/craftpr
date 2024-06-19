import { createStore } from "../utils/zustand";

const useHunks = createStore((set, get) => ({
  files: [],
  currentFile: 0,
  currentHunks: null,
  hunkIndex: 0,
  nextHunk: () => {
    const numHunks = get().currentHunks?.length || 1;
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
        currentHunks: null,
        hunkIndex: 0,
      });
    }
  },
  previousHunk: () => {
    const numHunks = get().currentHunks?.length || 1;
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
        currentHunks: null,
        hunkIndex: -1,
      });
    }
  },
  setCurrentFile: (index) => set({ currentFile: index }),
}));

export const nextHunk = () => useHunks.getState().nextHunk();
export const previousHunk = () => useHunks.getState().previousHunk();

export const useCurrentFilePath = () =>
  useHunks((state) => {
    return state.files[state.currentFile]?.path;
  });

export const getCurrentFilePath = () =>
  useHunks.getState().files[useHunks.getState().currentFile]?.path;

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
