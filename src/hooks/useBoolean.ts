import { useCallback, useMemo, useState } from "react";

export default function useBoolean(
  initialValue: boolean = false,
  onChange?: (value: boolean) => void,
): readonly [boolean, toggle: () => void, setValue: (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  // biome-ignore lint/correctness/useExhaustiveDependencies: don't include onChange in dependencies
  const toggle = useCallback(() => {
    setValue((prev) => {
      onChange?.(!prev);
      return !prev;
    });
  }, []);

  return useMemo(() => [value, toggle, setValue] as const, [value, toggle, setValue]);
}
