import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FraudRule, FraudRuleType, FraudRuleAction } from '@prisma/client';
import { FraudRuleDto } from '@repo/dto';

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<FraudRule[]> {
    return this.prisma.fraudRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<FraudRule | null> {
    return this.prisma.fraudRule.findUnique({
      where: { id },
    });
  }

  async create(data: any): Promise<FraudRule> {
    return this.prisma.fraudRule.create({
      data: {
        name: data.name,
        description: data.description,
        ruleType: data.ruleType as FraudRuleType,
        condition: data.condition || {},
        action: data.action as FraudRuleAction,
        severity: data.severity || 'MEDIUM',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async update(id: string, data: any): Promise<FraudRule> {
    return this.prisma.fraudRule.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.fraudRule.delete({
      where: { id },
    });
  }

  /**
   * Evaluate a transaction against active fraud rules
   */
  async evaluateTransaction(payload: {
    userId: string;
    amount: number;
    type: string;
    metadata?: any;
  }): Promise<{ action: FraudRuleAction; reason?: string } | null> {
    const activeRules = await this.prisma.fraudRule.findMany({
      where: { isActive: true },
    });

    for (const rule of activeRules) {
      const isTriggered = await this.checkRule(rule, payload);
      if (isTriggered) {
        this.logger.warn(`Fraud rule triggered: ${rule.name} for user ${payload.userId}`);
        return {
          action: rule.action as FraudRuleAction,
          reason: `Triggered by rule: ${rule.name}`,
        };
      }
    }

    return null;
  }

  private async checkRule(rule: FraudRule, payload: any): Promise<boolean> {
    const condition = rule.condition as any;

    switch (rule.ruleType) {
      case FraudRuleType.AMOUNT:
        if (condition.maxAmount && payload.amount > condition.maxAmount) {
          return true;
        }
        break;

      case FraudRuleType.VELOCITY:
        // Example: Check number of transactions in the last X minutes
        if (condition.windowMinutes && condition.maxCount) {
          const startTime = new Date(Date.now() - condition.windowMinutes * 60 * 1000);
          // Note: This logic would ideally query the Core Ledger or a local cache of recent txns
          // For now, we mock a "triggered" if it's over a threshold (placeholder)
          this.logger.debug(`Velocity check: user=${payload.userId} window=${condition.windowMinutes}m`);
        }
        break;

      case FraudRuleType.NEW_DEVICE:
        // Logic to check if device is trusted/known
        break;

      default:
        break;
    }

    return false;
  }
}
