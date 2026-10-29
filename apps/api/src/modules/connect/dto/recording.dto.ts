import { IsBoolean } from "class-validator";

export class SetRecordingConsentDto {
  @IsBoolean()
  consent!: boolean;
}
