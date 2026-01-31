export class SetupDemoRequestDto {
  secretKey?: string;
}

export class SetupDemoResponseDto {
  success!: boolean;
  accountId?: string;
  modulesEnabled?: number;
  userCreated?: boolean;
  message!: string;
  credentials?: {
    username: string;
    email: string;
    password: string;
  };
}
