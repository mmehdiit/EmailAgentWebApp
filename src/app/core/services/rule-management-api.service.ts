import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { SortableDashboardRule } from '../../shared/components/sortable-rule-item/sortable-rule-item.component';

@Injectable({
  providedIn: 'root'
})
export class RuleManagementApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService
  ) {}

  listRules(): Observable<SortableDashboardRule[]> {
    return this.http.get<SortableDashboardRule[]>(this.apiService.buildUrl('/dashboard/rules'), {
      withCredentials: true
    });
  }

  createRule(rule: SortableDashboardRule): Observable<SortableDashboardRule[]> {
    return this.http.post<SortableDashboardRule[]>(this.apiService.buildUrl('/dashboard/rules'), rule, {
      withCredentials: true
    });
  }

  updateRule(rule: SortableDashboardRule): Observable<SortableDashboardRule[]> {
    return this.http.put<SortableDashboardRule[]>(this.apiService.buildUrl(`/dashboard/rules/${rule.id}`), rule, {
      withCredentials: true
    });
  }

  deleteRule(ruleId: string): Observable<SortableDashboardRule[]> {
    return this.http.delete<SortableDashboardRule[]>(this.apiService.buildUrl(`/dashboard/rules/${ruleId}`), {
      withCredentials: true
    });
  }

  reorderRules(rules: SortableDashboardRule[]): Observable<SortableDashboardRule[]> {
    return this.http.post<SortableDashboardRule[]>(this.apiService.buildUrl('/dashboard/rules/reorder'), { rules }, {
      withCredentials: true
    });
  }
}
