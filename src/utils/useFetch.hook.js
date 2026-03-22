import { useEffect, useState } from "react";

export function useFetch(url) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (url) {
      let ignore = false;

      fetch(url)
        .then((response) => response.json())
        .then((json) => {
          if (!ignore) {
            setData(json);
          }
        })
        .catch((err) => {
          if (!ignore) {
            console.error("Fetch error:", err);
          }
        });

      return () => {
        ignore = true;
      };
    }
  }, [url]);

  return data;
}