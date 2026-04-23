import { IsString, IsEnum } from 'class-validator';
import { PIIField } from './store-pii.dto';

export class UpdatePIIDto {
  @IsEnum(PIIField)
  field: PIIField;

  @IsString()
  value: string;
}
