# Development Guidelines

Rules for all code contributions — human or AI.

---

## Code Quality

### No Comments
- No inline (`//`), block (`/* */`), JSDoc, or HTML (`<!-- -->`) comments anywhere
- Write self-documenting code: descriptive variable names, clear function names, expressive logic

### Simple Code
- No over-engineering, no unnecessary abstractions or wrappers
- Use standard Angular directives, lifecycles, and patterns directly
- Keep logic compact and readable

### No Native Browser Prompts
- Never use `prompt()`, `confirm()`, or `alert()` for user interaction
- Use custom modal components or inline form fields instead
- Modals should be simple, focused, and reusable across features

---

## Architecture

### Feature-Based Structure
```
src/app/
├── core/           → Singleton services and config (auth, drive, theme, google config)
├── shared/         → Reusable components and models (header, drive-login, theme-button, drive.model)
├── features/       → One directory per tool/functionality
│   ├── home/
│   ├── music/
│   ├── notes/
│   ├── browser/
│   ├── tierlist/
│   ├── understand/
│   └── projects/
```

### Reusability
- **Models**: Shared interfaces and types go in `shared/models/`. Feature-specific models go in `features/<name>/models/`
- **Services**: Core services (`DriveService`, `GoogleAuthService`, `ThemeService`) live in `core/services/` — never duplicate them
- **Components**: Reusable UI components (`HeaderComponent`, `DriveLoginComponent`) live in `shared/components/`
- Before creating a new model, service, or component, check if one already exists that can be extended

### Modularity
- Each feature owns its own components, templates, styles, models, and services
- Delete orphan files or components that are not actively imported
- No circular dependencies between features — features import from `core/` and `shared/`, never from each other

---

## Adding a New Feature

### 1. Create the feature directory
```
src/app/features/my-tool/
├── my-tool.component.ts
├── my-tool.component.html
├── my-tool.component.scss
├── models/          (if needed)
└── services/        (if needed)
```

### 2. Component setup
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-my-tool',
  imports: [CommonModule, HeaderComponent],
  templateUrl: './my-tool.component.html',
  styleUrl: './my-tool.component.scss'
})
export class MyToolComponent {
  title = 'My Tool';
}
```

### 3. Register the route
In `src/app/app.routes.ts`:
```typescript
import { MyToolComponent } from './features/my-tool/my-tool.component';

{ path: 'my-tool', component: MyToolComponent },
```

### 4. Add to dashboard
In `src/app/features/home/home.component.ts`, add to the `items` array:
```typescript
{ title: 'My Tool', description: 'What this tool does.', route: '/my-tool' }
```

### 5. Using Google Drive
Inject `DriveService` and `GoogleAuthService` from `core/services/`:
```typescript
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { DriveService } from '../../core/services/drive.service';
import { DriveLoginComponent } from '../../shared/components/drive-login/drive-login.component';
```

Use `DriveLoginComponent` in the template to gate Drive-dependent content behind authentication.

---

## UI Principles

- **Functional first**: Minimize clicks to complete any action
- **Modals over prompts**: Use lightweight custom modals, never native `prompt()`/`confirm()`/`alert()`
- **Inline creation**: Prefer text fields with Enter-to-submit for creating items (notes, folders, projects)
- **Reusable modals**: Build modal components that can be shared across features
- **Clean interface**: Reduce visual noise, keep developer-centric layout
