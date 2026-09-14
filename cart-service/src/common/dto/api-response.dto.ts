import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: '2026-09-13T06:00:00.000Z' })
  timestamp: string;

  constructor(data: T, message = 'Operation successful', success = true) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = 'Operation successful'): ApiResponseDto<T> {
    return new ApiResponseDto(data, message, true);
  }

  static error<T>(message: string, data: T = null): ApiResponseDto<T> {
    return new ApiResponseDto(data, message, false);
  }
}
