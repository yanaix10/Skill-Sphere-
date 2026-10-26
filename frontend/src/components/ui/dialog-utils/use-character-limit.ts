import { useState } from "react";

export function useCharacterLimit({
  maxLength,
  initialValue = "",
}: {
  maxLength: number;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const characterCount = value.length;

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (e.target.value.length <= maxLength) {
      setValue(e.target.value);
    }
  };

  return { value, setValue, characterCount, handleChange, maxLength };
}
