import Axios, { AxiosRequestConfig } from "axios";
import { supabaseBrowserClient } from "@/lib/supabase/client";

// baseURL MUST be empty string — OpenAPI paths include /api/v1/ prefix
// Next.js proxy routes /api/v1/* -> backend (avoids CORS and auth exposure)
const AXIOS_INSTANCE = Axios.create({ baseURL: "" });

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const {
    data: { session },
  } = await supabaseBrowserClient.auth.getSession();
  const token = session?.access_token ?? null;

  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...config.headers,
      ...options?.headers,
    },
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore — Orval generated code calls promise.cancel() if TanStack Query cancels
  promise.cancel = () => {
    source.cancel("Query was cancelled by React Query");
  };

  return promise;
};

// Required exports — Orval generated files import these types
export type ErrorType<Error> = import("axios").AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
