import { PipeTransform, BadRequestException } from '@nestjs/common';
import { WaitingStatus } from '../waitingStatus.enum';

export class WaitingStatusValidationPipe implements PipeTransform {
  readonly StatusOption = [
    WaitingStatus.WAITING,
    WaitingStatus.CANCELED,
    WaitingStatus.ENTERED,
    WaitingStatus.EXITED,
    WaitingStatus.CALLED,
    WaitingStatus.DELAYED,
    WaitingStatus.NOSHOW,
  ];

  transform(value: any) {
    value = value.toUpperCase();

    if (!this.isStatusValid(value)) {
      throw new BadRequestException(`${value} isn't in the status option`);
    }

    return value;
  }

  private isStatusValid(status: any) {
    const index = this.StatusOption.indexOf(status);
    return index !== -1;
  }
}
