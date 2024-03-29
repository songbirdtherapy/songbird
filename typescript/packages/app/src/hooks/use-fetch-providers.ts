import type { Provider } from "@songbird/precedent-iso";
import useSWR from "swr";

export const useFetchProviders = () => {
  const { data, isLoading, mutate } = useSWR<Provider[]>(
    "/api/proxy/admin/providers",
    async (url) => {
      const response = await fetch(url);
      const data = await response.json();
      return data.providers;
    }
  );

  return { data, isLoading, mutate };
};
