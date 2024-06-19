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
    // .then((data) => {
    //   // TODO: fix ugly way
    //   setFiles(data?.files || []);
    //   return data;
    // }),
  });
};

export const useFileDiff = (filePath) => {
  return useQuery({
    queryKey: [`files/${filePath}`],
    queryFn: () => {
      if (!filePath) return null;
      return fetch(baseUrl + `/file?path=${encodeURIComponent(filePath)}`, {
        method: "POST",
      }).then((data) => {
        return data.json();
      });
    },
  });
};

export const openFile = async (path) => {
  await fetch(baseUrl + `/open?path=${encodeURIComponent(path)}`, {
    method: "POST",
  });
};
