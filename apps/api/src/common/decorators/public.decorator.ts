import { SetMetadata, type CustomDecorator } from "@nestjs/common";

export const IS_PUBLIC_KEY = "dhriti:isPublic";

export function Public(): CustomDecorator<string> {
  return SetMetadata(IS_PUBLIC_KEY, true);
}
