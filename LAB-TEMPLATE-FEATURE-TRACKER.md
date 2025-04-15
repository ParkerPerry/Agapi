# Lab Templates & Goals Generation Feature Tracker

## Phase 1: UI Updates & Templates System
- [x] Create feature tracker
- [x] Update terminology (personas → collectives) in Results tab
- [x] Define data schema for lab templates
- [x] Create predefined templates data structure
- [x] Implement template selection UI component
- [x] Add template application functionality
- [x] Update lab creation flow to incorporate templates

## Phase 2: LLM Integration
- [ ] Create OpenAI prompt for goals/metrics generation
- [ ] Implement backend endpoint for LLM goal generation
- [ ] Add frontend integration for LLM suggestions
- [ ] Implement loading states and user feedback
- [ ] Add validation and refinement UI for suggested metrics

## Phase 3: Results Integration
- [ ] Update Results tab to use actual metrics from experiment setup
- [ ] Implement dynamic visualization based on defined metrics
- [ ] Add performance calculation logic for each metric type
- [ ] Create GO/WAIT recommendation system based on metrics performance
- [ ] Integrate collective performance with metrics evaluation

## Current Progress
- Created feature tracker ✓
- Updated "Audience Persona Analysis" terminology to "Collective Analysis" ✓
- Defined schema for lab templates in shared/schema.ts ✓
- Created predefined templates for different experiment categories ✓
- Created template selection UI component with category filtering ✓
- Implemented goals editor with template application functionality ✓
- Updated lab creation wizard to include template selection ✓
- Next: Begin LLM integration for custom goal generation