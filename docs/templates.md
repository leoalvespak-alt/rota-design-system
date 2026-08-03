# Templates — Sistema Declarativo

## Schemas

Templates sao validados por schemas Zod em `src/features/templates/schemas.ts`.

### TemplateMetadata

```typescript
{
  id: string
  name: string
  category: string
  filter: 'square' | 'portrait' | 'carousel'
  format: 'square' | 'portrait'
  tags: ('fiscal' | 'policial' | 'tribunal' | 'motivacao')[]
  slots?: SlotDefinition[]
  variants?: TemplateVariant[]
  constraints?: TemplateConstraints
  qualityRules?: QualityRule[]
  layoutRules?: LayoutRule[]
  capabilities?: TemplateCapabilities
  fieldSchema?: FieldSchema
}
```

### Slots

Cada slot define uma area editavel:

```typescript
{
  id: string
  type: 'text' | 'image' | 'icon' | 'badge' | 'divider'
  label: string
  required: boolean
  editable: boolean
  constraints?: { maxWidth, maxHeight, aspectRatio, ... }
}
```

### Renderer Declarativo

`DeclarativeRenderer` renderiza templates a partir do schema:

```tsx
<DeclarativeRenderer metadata={template} values={userValues} dark={isDark} />
```

O `SlotRenderer` renderiza cada slot individualmente baseado no tipo.

### Validacao

```typescript
import { validateTemplateMetadata, safeValidateTemplateMetadata } from './schemas'

// Throws on invalid
const meta = validateTemplateMetadata(data)

// Returns { success, data/error }
const result = safeValidateTemplateMetadata(data)
```

## Quality Rules

Regras de qualidade por template:

```typescript
{
  id: 'title-max',
  severity: 'warning',
  check: 'max-length',
  field: 'title',
  params: { max: 60 }
}
```

Checks disponiveis: `required`, `max-length`, `image-required`, `binding`, `contrast`.
