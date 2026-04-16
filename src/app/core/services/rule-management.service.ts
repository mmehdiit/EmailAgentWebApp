import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SortableDashboardRule } from '../../shared/components/sortable-rule-item/sortable-rule-item.component';
import { RuleManagementApiService } from './rule-management-api.service';

const RULES_STORAGE_KEY = 'email-ai-agent-rules';

@Injectable({
  providedIn: 'root'
})
export class RuleManagementService {
  constructor(private readonly ruleManagementApiService: RuleManagementApiService) {}

  async listRules(fallbackRules: SortableDashboardRule[]): Promise<SortableDashboardRule[]> {
    const storedRules = this.readStoredRules();
    if (storedRules.length > 0) {
      return storedRules;
    }

    try {
      return await firstValueFrom(this.ruleManagementApiService.listRules());
    } catch {
      this.writeRules(fallbackRules);
      return fallbackRules;
    }
  }

  async saveRule(rule: SortableDashboardRule, currentRules: SortableDashboardRule[]): Promise<SortableDashboardRule[]> {
    const nextRules = rule.id
      ? currentRules.map((currentRule) => (currentRule.id === rule.id ? rule : currentRule))
      : [{ ...rule, id: `rule-${Date.now()}` }, ...currentRules];

    const normalizedRules = this.withRecalculatedPriorities(nextRules);

    try {
      if (rule.id) {
        return await firstValueFrom(this.ruleManagementApiService.updateRule(rule));
      }

      return await firstValueFrom(this.ruleManagementApiService.createRule(rule));
    } catch {
      this.writeRules(normalizedRules);
      return normalizedRules;
    }
  }

  async deleteRule(ruleId: string, currentRules: SortableDashboardRule[]): Promise<SortableDashboardRule[]> {
    const nextRules = this.withRecalculatedPriorities(
      currentRules.filter((rule) => rule.id !== ruleId)
    );

    try {
      return await firstValueFrom(this.ruleManagementApiService.deleteRule(ruleId));
    } catch {
      this.writeRules(nextRules);
      return nextRules;
    }
  }

  async reorderRules(rules: SortableDashboardRule[]): Promise<SortableDashboardRule[]> {
    const normalizedRules = this.withRecalculatedPriorities(rules);

    try {
      return await firstValueFrom(this.ruleManagementApiService.reorderRules(normalizedRules));
    } catch {
      this.writeRules(normalizedRules);
      return normalizedRules;
    }
  }

  private withRecalculatedPriorities(rules: SortableDashboardRule[]): SortableDashboardRule[] {
    const highestPriority = rules.length;
    return rules.map((rule, index) => ({
      ...rule,
      priority: highestPriority - index
    }));
  }

  private readStoredRules(): SortableDashboardRule[] {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as SortableDashboardRule[];
    } catch {
      localStorage.removeItem(RULES_STORAGE_KEY);
      return [];
    }
  }

  private writeRules(rules: SortableDashboardRule[]): void {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  }
}
