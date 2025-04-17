import { useCallback, useState } from "react";

export default function useBoolean(
  initialValue: boolean = false,
): readonly [boolean, toggle: () => void, setValue: (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue] as const;
}
