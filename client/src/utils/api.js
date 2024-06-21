import { useQuery } from "@tanstack/react-query";
import { setFiles } from "../stores/hunks";

const baseUrl = import.meta.env.VITE_API_ENDPOINT;

export const useFiles = () => {
  return useQuery({
    queryKey: ["files"],
    queryFn: () =>
      fetch(baseUrl + "/diff", {
        method: "POST",
      })
        .then((data) => data.json())
        .then((data) => {
          // TODO: fix ugly way
          const files = [...(data?.files || [])].sort((a, b) =>
            a?.path?.localeCompare(b?.path),
          );
          setFiles(files);
          return data;
        }),
  });
};

export const fetchFileDiff = (filePath) =>
  fetch(baseUrl + `/file?path=${encodeURIComponent(filePath)}`, {
    method: "POST",
  }).then((data) => {
    return data.json();
  });

export const openFile = async (path, lineNumber) => {
  console.log("open", path, lineNumber);
  await fetch(
    baseUrl + `/open?path=${encodeURIComponent(path)}&line=${lineNumber}`,
    {
      method: "POST",
    },
  );
};
