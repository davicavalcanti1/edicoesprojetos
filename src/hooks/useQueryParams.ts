import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export function useQueryParams<T extends Record<string, string>>() {
    const { search } = useLocation();

    return useMemo(() => {
        const params = new URLSearchParams(search);
        const result: Record<string, string> = {};

        params.forEach((value, key) => {
            result[key] = value;
        });

        return result as T;
    }, [search]);
}
