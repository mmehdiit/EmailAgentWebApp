# Angular migration structure

This Angular app is the migration target for the React application in:
`C:\CE-Resources\Third-Party-projects\email-ai-agent\email-ai-agent-main-6\email-ai-agent-main-6`

Use this structure during migration:

- `core/`: application-wide services, guards, interceptors, models, and shared state.
- `shared/`: reusable Angular components, directives, pipes, layout shells, UI wrappers, and utility helpers.
- `features/auth`: migrate `src/pages/Auth.tsx`.
- `features/dashboard`: migrate `src/pages/Dashboard.tsx` and dashboard composition.
- `features/mark-replies`: migrate `src/pages/MarkReplies.tsx`.
- `features/email-sorting`: migrate `src/components/EmailSortingDashboard.tsx`.
- `features/keywords`: migrate `src/components/KeywordManager.tsx`.
- `features/navigation`: migrate `src/components/NavigationList.tsx`.
- `features/recipients`: migrate `src/components/RecipientManager.tsx`.
- `features/reply-templates`: migrate `src/components/ReplyTemplates.tsx` and `RuleTemplates.tsx`.
- `features/rules`: migrate `src/components/RulePreview.tsx` and related rule management logic.
- `features/unread-labels`: migrate `src/components/UnreadLabelManager.tsx`.
- `features/users`: migrate `src/components/UserManagement.tsx`.
- `features/vacation-responder`: migrate `src/components/VacationResponder.tsx`.
- `shared/ui`: migrate reusable pieces from `src/components/ui/*`.
- `core/services` or `core/state`: migrate shared logic from `src/hooks/*`, `src/lib/utils.ts`, and `src/integrations/supabase/*`.

Recommended migration order:

1. `core/models`, `core/services`, `core/state`
2. `shared/ui`, `shared/components`, `shared/layout`
3. `features/auth`, `features/dashboard`
4. remaining feature folders
