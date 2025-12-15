import { ApiProperty } from '@nestjs/swagger';

export class PolicySummaryDto {
  @ApiProperty({
    description: 'Total number of active policies',
  })
  activePolicies: number;

  @ApiProperty({
    description: 'Total annual premium cost',
  })
  annualCost: number;

  @ApiProperty({
    description: 'Currency of annual cost',
  })
  currency: string;

  @ApiProperty({
    description: 'Number of policies expiring soon',
  })
  expiringCount: number;

  @ApiProperty({
    description: 'Number of policies pending renewal',
  })
  pendingRenewalCount: number;
}
